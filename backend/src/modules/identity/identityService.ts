import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../../database/index.js';
import { config } from '../../config/index.js';
import { AuthenticationError, ConflictError, NotFoundError } from '../../shared/errors.js';
import { UserRole } from '../authorization/permissions.js';
import { AuditService } from '../audit/auditService.js';

export interface CreateUserInput {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export class IdentityService {
  public static async createUser(input: CreateUserInput, actorId?: string): Promise<any> {
    const existing = await query('SELECT id FROM users WHERE email = $1', [input.email.toLowerCase()]);
    if (existing.rows.length > 0) {
      throw new ConflictError(`User with email '${input.email}' already exists`);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const res = await query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, tenant_id, name, email, role, phone, is_active, created_at`,
      [input.tenantId, input.name, input.email.toLowerCase(), passwordHash, input.role, input.phone || null]
    );

    const user = res.rows[0];

    await AuditService.record({
      tenantId: user.tenant_id,
      actorId,
      action: 'USER_CREATED',
      resourceType: 'user',
      resourceId: user.id,
      details: { email: user.email, role: user.role },
    });

    return user;
  }

  public static async login(email: string, password: string, deviceId?: string, clientIp?: string): Promise<LoginResult> {
    const res = await query(
      `SELECT u.id, u.tenant_id, u.name, u.email, u.password_hash, u.role, u.is_active, o.is_active as org_active
       FROM users u
       JOIN organizations o ON o.id = u.tenant_id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (res.rows.length === 0) {
      throw new AuthenticationError('Invalid email or password');
    }

    const user = res.rows[0];
    if (!user.is_active || !user.org_active) {
      throw new AuthenticationError('Account or organization is inactive');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password');
    }

    // 1. Generate Access Token (JWT)
    const accessToken = jwt.sign(
      {
        sub: user.id,
        tenantId: user.tenant_id,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN_SECONDS }
    );

    // 2. Generate Refresh Token
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO user_refresh_tokens (user_id, token_hash, device_id, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [user.id, tokenHash, deviceId || null, expiresAt]
    );

    await AuditService.record({
      tenantId: user.tenant_id,
      actorId: user.id,
      action: 'USER_LOGIN_SUCCESS',
      resourceType: 'user',
      resourceId: user.id,
      clientIp,
      details: { role: user.role },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: config.JWT_EXPIRES_IN_SECONDS,
      user: {
        id: user.id,
        tenantId: user.tenant_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  public static async refreshAccessToken(rawRefreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const res = await query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.is_revoked, u.tenant_id, u.role, u.email, u.name, u.is_active
       FROM user_refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`,
      [tokenHash]
    );

    if (res.rows.length === 0) {
      throw new AuthenticationError('Invalid refresh token');
    }

    const tokenRecord = res.rows[0];
    if (tokenRecord.is_revoked || new Date(tokenRecord.expires_at) < new Date() || !tokenRecord.is_active) {
      throw new AuthenticationError('Refresh token is expired or revoked');
    }

    const accessToken = jwt.sign(
      {
        sub: tokenRecord.user_id,
        tenantId: tokenRecord.tenant_id,
        role: tokenRecord.role,
        email: tokenRecord.email,
        name: tokenRecord.name,
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN_SECONDS }
    );

    return {
      accessToken,
      expiresIn: config.JWT_EXPIRES_IN_SECONDS,
    };
  }

  public static async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    await query(
      'UPDATE user_refresh_tokens SET is_revoked = true WHERE token_hash = $1',
      [tokenHash]
    );
  }

  public static async getUserById(id: string): Promise<any> {
    const res = await query(
      'SELECT id, tenant_id, name, email, role, phone, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    if (res.rows.length === 0) {
      throw new NotFoundError(`User with ID '${id}' not found`);
    }
    return res.rows[0];
  }
}

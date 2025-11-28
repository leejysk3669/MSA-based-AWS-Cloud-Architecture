import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    username: string;
    groups?: string[];
  };
}

// Cognito 설정 (커뮤니티 게시판 서비스와 동일 값 사용)
const COGNITO_USER_POOL_ID = 'ap-northeast-2_VrMMVwNd8';
const COGNITO_REGION = 'ap-northeast-2';
const COGNITO_CLIENT_ID = '2b797ioh6lhc571p8k463n3fmt';

// JWKS 클라이언트 설정
const jwksClient = jwksRsa({
  jwksUri: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000
});

// JWT 검증 함수
const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      (header: any, callback: any) => {
        jwksClient.getSigningKey(header.kid, (err: any, key: any) => {
          if (err) return callback(err);
          const signingKey = key.publicKey || key.rsaPublicKey;
          callback(null, signingKey);
        });
      },
      {
        issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
        audience: COGNITO_CLIENT_ID
      },
      (err: any, decoded: any) => {
        if (err) return reject(err);
        resolve(decoded);
      }
    );
  });
};

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authorization header is required' });
    }

    const token = authHeader.substring(7);
    try {
      const decoded = await verifyToken(token);
      req.user = {
        sub: decoded.sub,
        email: decoded.email,
        username: decoded['cognito:username'] || decoded.email,
        groups: decoded['cognito:groups'] || []
      };
      next();
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('인증 미들웨어 오류:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Authentication failed' });
  }
};

export const optionalAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    try {
      const decoded = await verifyToken(token);
      req.user = {
        sub: decoded.sub,
        email: decoded.email,
        username: decoded['cognito:username'] || decoded.email,
        groups: decoded['cognito:groups'] || []
      };
      next();
    } catch (tokenError) {
      console.warn('Optional auth: Invalid token, but continuing:', tokenError);
      next();
    }
  } catch (error) {
    console.error('선택적 인증 미들웨어 오류:', error);
    next();
  }
};

export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }
  const isAdmin = req.user.groups?.includes('admin') || req.user.groups?.includes('Admin');
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin privileges required' });
  }
  next();
};

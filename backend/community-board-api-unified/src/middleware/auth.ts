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

// Cognito 설정
const COGNITO_USER_POOL_ID = 'ap-northeast-2_VrMMVwNd8';
const COGNITO_REGION = 'ap-northeast-2';

// JWKS 클라이언트 설정
const client = jwksRsa({
  jwksUri: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000 // 10분
});

// JWT 검증 함수
const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, (header: any, callback: any) => {
      client.getSigningKey(header.kid, (err: any, key: any) => {
        if (err) {
          return callback(err);
        }
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
      });
    }, {
      issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
      audience: '2b797ioh6lhc571p8k463n3fmt' // Cognito Client ID
    }, (err: any, decoded: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

// 인증 미들웨어
export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authorization header is required' 
      });
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거
    
    try {
      const decoded = await verifyToken(token);
      
      // 사용자 정보를 request 객체에 추가
      req.user = {
        sub: decoded.sub,
        email: decoded.email,
        username: decoded['cognito:username'] || decoded.email,
        groups: decoded['cognito:groups'] || []
      };
      
      next();
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired token' 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Authentication failed' 
    });
  }
};

// 선택적 인증 미들웨어 (토큰이 있으면 검증, 없으면 통과)
export const optionalAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 토큰이 없으면 그냥 통과
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
      // 토큰이 유효하지 않으면 그냥 통과 (선택적 인증이므로)
      console.warn('Optional auth: Invalid token, but continuing:', tokenError);
      next();
    }
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// 관리자 권한 확인 미들웨어
export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required' 
    });
  }

  const isAdmin = req.user.groups?.includes('admin') || req.user.groups?.includes('Admin');
  
  if (!isAdmin) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Admin privileges required' 
    });
  }

  next();
};

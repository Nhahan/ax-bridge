import { z } from 'zod';

const envSchema = z.object({
  ZAPIER_WEBHOOK_URL: z.string().url('ZAPIER_WEBHOOK_URL은 유효한 URL이어야 합니다'),
  PORT: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).default('3000'),
});

export type EnvVars = z.infer<typeof envSchema>;

let validatedEnv: EnvVars | null = null;

export function validateEnv(): EnvVars {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse({
      ZAPIER_WEBHOOK_URL: process.env.ZAPIER_WEBHOOK_URL,
      PORT: process.env.PORT,
    });
    
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      }).join('\n');
      
      throw new Error(
        `환경 변수 검증 실패:\n${formattedErrors}\n\n` +
        `애플리케이션을 시작하기 전에 .env.local 파일에 올바른 환경 변수를 설정해주세요.`
      );
    }
    
    throw error;
  }
}

export const env = new Proxy({} as EnvVars, {
  get: (target, prop) => {
    const validEnv = validateEnv();
    return validEnv[prop as keyof EnvVars];
  }
});
# 환경 변수 정의 가이드

이 프로젝트에서는 `zod` 라이브러리를 사용하여 환경 변수를 검증하고 타입 안전성을 보장합니다. 아래는 환경 변수를 코드로 정의하고 사용하는 방법에 대한 가이드입니다.

## 1. 환경 변수 스키마 정의하기

`src/lib/validateEnv.ts` 파일에서 환경 변수의 스키마를 정의합니다. 이 스키마는 각 환경 변수의 이름, 타입, 유효성 검증 규칙을 포함합니다.

```typescript
import { z } from 'zod';

/**
 * 환경 변수를 위한 zod 스키마
 */
const envSchema = z.object({
  // 기존 환경 변수
  ZAPIER_WEBHOOK_URL: z.string().url('ZAPIER_WEBHOOK_URL은 유효한 URL이어야 합니다'),
  
  // 새로운 환경 변수 추가 예시
  API_KEY: z.string().min(1, 'API_KEY는 비어있을 수 없습니다'),
  PORT: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()),
  DEBUG_MODE: z.enum(['true', 'false']).transform(val => val === 'true'),
});

/**
 * 환경 변수 타입 정의
 */
export type EnvVars = z.infer<typeof envSchema>;
```

## 2. 환경 변수 접근 방법

환경 변수에 접근하려면 `env` 객체를 임포트하여 사용합니다. 이 객체는 Proxy로 구현되어 있어 환경 변수에 처음 접근할 때 자동으로 검증을 수행합니다.

```typescript
import { env } from '@/lib/validateEnv';

// 검증된 환경 변수 사용 예시
const webhookUrl = env.ZAPIER_WEBHOOK_URL;
const apiKey = env.API_KEY;
const port = env.PORT; // 숫자 타입으로 자동 변환됨
const isDebug = env.DEBUG_MODE; // boolean 타입으로 자동 변환됨
```

## 3. 새로운 환경 변수 추가하기

새로운 환경 변수를 추가하려면 다음 단계를 따르세요:

1. `.env.local` 파일에 새 환경 변수를 추가합니다:
   ```
   ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/123456/abcdef
   API_KEY=your_api_key_here
   PORT=3000
   DEBUG_MODE=false
   ```

2. `src/lib/validateEnv.ts` 파일의 `envSchema`에 새 환경 변수를 추가합니다:
   ```typescript
   const envSchema = z.object({
     // 기존 환경 변수
     ZAPIER_WEBHOOK_URL: z.string().url('ZAPIER_WEBHOOK_URL은 유효한 URL이어야 합니다'),
     
     // 새 환경 변수 추가
     NEW_VARIABLE: z.string().min(1, 'NEW_VARIABLE은 비어있을 수 없습니다'),
   });
   ```

3. `validateEnv` 함수의 `parse` 호출 부분에도 새 환경 변수를 추가합니다:
   ```typescript
   validatedEnv = envSchema.parse({
     ZAPIER_WEBHOOK_URL: process.env.ZAPIER_WEBHOOK_URL,
     NEW_VARIABLE: process.env.NEW_VARIABLE,
   });
   ```

## 4. 고급 환경 변수 검증 예시

Zod를 사용하면 다양한 형태의 검증과 변환을 적용할 수 있습니다:

### 숫자 타입 환경 변수
```typescript
PORT: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()),
```

### 불리언 타입 환경 변수
```typescript
DEBUG_MODE: z.enum(['true', 'false']).transform(val => val === 'true'),
```

### 여러 값 중 하나여야 하는 환경 변수
```typescript
NODE_ENV: z.enum(['development', 'production', 'test']),
```

### 선택적 환경 변수 (값이 없어도 되는 경우)
```typescript
OPTIONAL_VAR: z.string().optional(),
```

### 기본값이 있는 환경 변수
```typescript
TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('30'),
```

## 5. 주의사항

- 환경 변수가 없거나 형식이 잘못된 경우 애플리케이션은 시작되지 않고 오류를 출력합니다.
- 개발 시에는 `.env.local` 파일을 생성하여 환경 변수를 설정하세요.
- 환경 변수를 추가하거나 수정할 때는 반드시 `src/lib/validateEnv.ts` 파일도 함께 업데이트하세요.
- 실제 배포 환경에서는 호스팅 서비스의 환경 변수 설정 방법을 따르세요. 
# AX-Bridge

외부 API 호출을 Zapier와 통합하기 위한 브릿지 API 서비스입니다. 이 서비스는 외부 API 호출을 받아 Zapier 웹훅으로 전달하고, Zapier의 응답을 원래 호출자에게 반환하는 프록시 역할을 합니다.

## 기능

- 외부 소스에서 API 호출 수신
- Zapier 웹훅으로 요청 전달
- Zapier의 응답을 원래 호출자에게 반환
- 간단하고 직관적인 API 엔드포인트 설계

## 시작하기

1. 저장소 복제
2. 의존성 설치:
```bash
npm install
```
3. Zapier 웹훅 URL이 포함된 `.env.local` 파일 생성:
```
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/your-webhook-id
```
4. 개발 서버 실행:
```bash
npm run dev
```
5. [http://localhost:3000](http://localhost:3000)에서 애플리케이션 확인

## API 사용법

### Zapier 워크플로우 트리거

```
POST /api/zapier

{
  "key": "value",
  "data": {
    "nestedKey": "nestedValue"
  }
}
```

API는 이 페이로드를 Zapier 웹훅으로 전달하고 응답을 반환합니다.

## 배포

이 애플리케이션은 [Vercel](https://vercel.com) 또는 다른 Next.js 호환 호스팅 서비스를 사용하여 배포할 수 있습니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 제공됩니다. 
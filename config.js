// 7942 설정
// 1) 반 코드 등록소 웹 앱 주소 (비워 두면 반 코드 기능이 숨겨짐)
window.REGISTRY_URL = 'https://script.google.com/macros/s/AKfycbyMtTZkspnQU8jaPJrW2kTmHVFgpOlho-eJp9B-AeR6XAMbteEiO3M4p6DyfreDrY_SHA/exec';

// 2) AI 분석 (또싫!과 같은 방식)
//    firebase: 파이어베이스 콘솔 > 프로젝트 설정 > 내 앱(웹)의 값. 비워 두면 '내 Gemini 키'로만 분석해요.
//    recaptchaSiteKey: App Check(reCAPTCHA Enterprise) 사이트 키
//    trial: 다른 선생님이 7942의 AI로 무료 체험할 수 있는 횟수 (그 뒤엔 자기 Gemini 키)
//    freeShells: 횟수 제한 없이 쓰는 반(껍데기 주소 키를 SHA-256 으로 바꾼 값) — 만든이 반
window.AI_CONFIG = {
  firebase: null,
  recaptchaSiteKey: '',
  models: ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-3.5-flash-lite'],
  trial: 3,
  freeShells: ['9d7cbe8d5dae1d1004a69ddc75164c6d000c6732647699433d5c56baf29f2323']
};

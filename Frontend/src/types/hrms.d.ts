declare module '@/hrms/*' {
  const content: any;
  export default content;
  export const setupMockBackend: any;
  export const getAuthUser: any;
  export const setAuthUser: any;
  export const resetLocalState: any;
  export const DEMO_HR_ACCOUNTS: any;
}

declare module '../../hrms/*' {
  const content: any;
  export default content;
  export const setupMockBackend: any;
  export const getAuthUser: any;
  export const setAuthUser: any;
  export const resetLocalState: any;
  export const DEMO_HR_ACCOUNTS: any;
}

declare module '../../hrms/components/*' {
  const content: any;
  export default content;
}

declare module '../../hrms/services/*' {
  export const setupMockBackend: any;
  export const getAuthUser: any;
  export const setAuthUser: any;
  export const resetLocalState: any;
  export const DEMO_HR_ACCOUNTS: any;
}

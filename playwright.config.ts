import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./e2e',timeout:90000,workers:1,
  use:{baseURL:'http://127.0.0.1:5173',channel:'msedge',headless:true,viewport:{width:1180,height:820},screenshot:'only-on-failure'},
  webServer:{command:'pnpm dev',url:'http://127.0.0.1:5173',reuseExistingServer:true,timeout:60000},
});

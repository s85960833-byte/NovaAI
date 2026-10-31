import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests', timeout:45000, expect:{timeout:10000}, fullyParallel:false, retries:0,
 reporter:[['list'],['html',{outputFolder:'playwright-report',open:'never'}]],
 use:{baseURL:'http://127.0.0.1:8787',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[{name:'chromium',use:{browserName:'chromium'}},{name:'firefox',use:{browserName:'firefox'}},{name:'webkit',use:{browserName:'webkit'}}],
});

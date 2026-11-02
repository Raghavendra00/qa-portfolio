const {test}=require('node:test');
const assert=require('node:assert/strict');
const handler=require('./api/chat.js');
const originalFetch=global.fetch;
const originalKey=process.env.GEMINI_API_KEY;
async function request(method,body,headers={}){let result;const res={setHeader(){},status(code){this.code=code;return this},json(data){result={code:this.code,data};return result}};await handler({method,body,headers},res);return result;}
test('chat API validates requests and handles provider failures without exposing secrets',async()=>{
 try{
  delete process.env.GEMINI_API_KEY;
  assert.deepEqual(await request('GET'),{code:200,data:{available:false}});
  assert.equal((await request('DELETE')).code,405);
  for(const body of [{},{question:''},{question:25},{question:'x'.repeat(501)},'{bad json'])assert.equal((await request('POST',body)).code,400);
  assert.equal((await request('POST',{question:'Hi'},{origin:'https://other.test',host:'portfolio.test'})).code,403);
  assert.equal((await request('POST',{question:'Hi'})).code,503);
  process.env.GEMINI_API_KEY='test-only-placeholder';
  assert.deepEqual(await request('GET'),{code:200,data:{available:true}});
  global.fetch=async(url,options)=>{assert.ok(url.endsWith(':generateContent'));assert.equal(options.headers['x-goog-api-key'],'test-only-placeholder');assert.equal(JSON.parse(options.body).contents[0].parts[0].text,'Experience?');return{ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Profile answer.'}]}}]})}};
  assert.deepEqual(await request('POST',{question:'Experience?'},{origin:'https://portfolio.test',host:'portfolio.test'}),{code:200,data:{answer:'Profile answer.'}});
  global.fetch=async()=>({ok:false});assert.equal((await request('POST',{question:'Hi'})).code,502);
  global.fetch=async()=>({ok:true,json:async()=>({candidates:[]})});assert.equal((await request('POST',{question:'Hi'})).code,502);
  global.fetch=async()=>{throw new Error('test-only provider failure')};const failed=await request('POST',{question:'Hi'});assert.equal(failed.code,502);assert.ok(!JSON.stringify(failed).includes('test-only'));
 }finally{global.fetch=originalFetch;if(originalKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=originalKey;}
});

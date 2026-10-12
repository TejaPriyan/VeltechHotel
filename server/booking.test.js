const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'hotel-test-'));
process.env.DB_PATH=path.join(temp,'test.db');
process.env.JWT_SECRET='isolated-test-secret-not-for-production';
delete process.env.ADMIN_EMAIL;
delete process.env.ADMIN_PASSWORD;
const {initDb,query}=require('./database');
const {validateStay}=require('./stay');
test('invalid dates and capacity are rejected',()=>{
 for(const args of [['bad','2030-01-02',1,2],['2030-02-30','2030-03-03',1,2],['2030-01-02','2030-01-01',1,2],['2030-01-01','2030-01-02',3,2]]) assert(validateStay(...args).error);
 assert.equal(validateStay('2030-01-01','2030-01-03',2,2).nights,2);
});
test('API blocks overlaps, allows adjacent stays, and does not seed an admin',async()=>{
 await initDb();
 assert.equal(query.get("SELECT COUNT(*) AS n FROM users WHERE role='admin'").n,0);
 const user=query.run("INSERT INTO users(name,email,password) VALUES('Test','test@example.com','unused')").lastInsertRowid;
 const app=require('express')(); app.use(require('express').json()); app.use('/bookings',require('./routes/bookings'));
 const server=app.listen(0,'127.0.0.1'); await new Promise(r=>server.once('listening',r));
 const token=require('jsonwebtoken').sign({id:user},process.env.JWT_SECRET);
 const payload={fullName:'Test',email:'test@example.com',phone:'1234567890',roomId:1,checkInDate:'2030-01-01',checkOutDate:'2030-01-03',guests:1,idProofType:'test',idProofNumber:'test'};
 const book=body=>fetch(`http://127.0.0.1:${server.address().port}/bookings`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});
 try {
  const first=await book(payload); assert.equal(first.status,201); assert.match((await first.json()).message,/awaiting confirmation/);
  assert.equal((await book(payload)).status,409);
  assert.equal((await book({...payload,checkInDate:'2030-01-03',checkOutDate:'2030-01-04'})).status,201);
  assert.equal((await book({...payload,checkInDate:'invalid'})).status,400);
 }finally{await new Promise(r=>server.close(r));fs.rmSync(temp,{recursive:true,force:true});}
});

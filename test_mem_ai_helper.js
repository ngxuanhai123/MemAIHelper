/**
 * TEST SUITE: Memrise AI Helper (MemAIHelper)
 * Kiểm thử toàn diện chức năng & bảo mật
 */

const fs = require('fs');
const path = require('path');

const results = [];
function recordResult(name, passed, details) {
  results.push({ name, passed, details });
  const mark = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${mark} | ${name}`);
  if (details) console.log(`   └─ ${details}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ DỰ ÁN: MemAIHelper');
  console.log('====================================================\n');

  const dir = __dirname;
  const scriptPath = path.join(dir, 'Memrise AI Helper.js');
  const readmePath = path.join(dir, 'README.md');

  // TEST 1: File tồn tại
  try {
    const hasScript = fs.existsSync(scriptPath);
    const hasReadme = fs.existsSync(readmePath);
    recordResult('1. Cấu trúc file Userscript', hasScript && hasReadme, `Script: ${hasScript}, Readme: ${hasReadme}`);
  } catch (e) {
    recordResult('1. Cấu trúc file Userscript', false, e.message);
  }

  const content = fs.readFileSync(scriptPath, 'utf8');

  // TEST 2: Header @connect có domain ai-free và không còn ai-no-free
  try {
    const hasConnectAiFree = content.includes('@connect      ai-free.ngxuanhai123.workers.dev');
    const hasNoAiNoFree = !content.includes('ai-no-free');
    const passed = hasConnectAiFree && hasNoAiNoFree;
    recordResult('2. Header @connect cấp phép domain ai-free trên Tampermonkey', passed, passed ? 'Đã cấp phép kết nối ai-free, loại bỏ ai-no-free' : 'Sai cấu hình domain @connect');
  } catch (e) {
    recordResult('2. Header @connect cấp phép domain ai-free', false, e.message);
  }

  // TEST 3: Cấu hình mặc định AI Gateway ai-free
  try {
    const hasNewEndpoint = content.includes('ai-free.ngxuanhai123.workers.dev');
    const passed = hasNewEndpoint;
    recordResult('3. Cấu hình AI Gateway mặc định (ai-free)', passed, `ai-free: ${hasNewEndpoint}`);
  } catch (e) {
    recordResult('3. Cấu hình AI Gateway mặc định', false, e.message);
  }

  // TEST 4: Gọi thử AI Gateway thực tế cho dịch từ vựng song ngữ
  try {
    const t0 = Date.now();
    const prompt = 'Dịch sang tiếng Việt cho từ/câu: "rumah sakit" (Ngữ cảnh tiếng Anh: "hospital"). Định dạng: **Bệnh viện**, cơ sở khám chữa bệnh.';
    const res = await fetch('https://ai-free.ngxuanhai123.workers.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client': 'mem-ai-helper'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'Bạn là trợ lý dịch thuật song ngữ cho Memrise và Duolingo. Trả về kết quả: **nghĩa chính**, bên dưới là giải thích ngắn gọn.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 50
      })
    });
    const lat = Date.now() - t0;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const passed = res.status === 200 && text.length > 0;
    recordResult('4. Gọi thử AI Gateway thực tế dịch song ngữ Memrise', passed, `Status: ${res.status}, Latency: ${lat}ms, Trả lời: "${text.trim().replace(/\n/g, ' ')}"`);
  } catch (e) {
    recordResult('4. Gọi thử AI Gateway thực tế dịch song ngữ Memrise', false, e.message);
  }

  const passedCount = results.filter(r => r.passed).length;
  console.log('\n====================================================');
  console.log(`📊 KẾT QUẢ KIỂM THỬ: ${passedCount}/${results.length} bài test vượt qua`);
  console.log('====================================================\n');
}

runTests();

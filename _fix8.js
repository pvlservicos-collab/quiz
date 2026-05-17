const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

// ── 1. Adiciona SDK Supabase no <head> ──────────────────────────────────────
html = html.replace(
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>\n<link rel="preconnect" href="https://fonts.googleapis.com">'
);

// ── 2. Insere bloco de tracking antes das variáveis do quiz ─────────────────
const trackingBlock = `
// ── Analytics (Supabase) ──────────────────────────────────────────────────
var _SB_URL = 'https://fftgdntnavupoghgamia.supabase.co';
var _SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdGdkbnRuYXZ1cG9naGdhbWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgzMDYsImV4cCI6MjA5MzE2NDMwNn0.dP_vw2K3uFwjw7H4o2H4HDrJVc74vHO_4bnAK7orCYs';
var _sb = null;
var _sessionId = null;
var _sessionAnswers = {};

function _getSB() {
  try { if (!_sb && window.supabase) _sb = window.supabase.createClient(_SB_URL, _SB_KEY); } catch(e){}
  return _sb;
}
function _uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16);
  });
}
function trackStart(g) {
  _sessionId = _uuid();
  _sessionAnswers = {};
  var sb = _getSB(); if (!sb) return;
  sb.from('fitness_quiz_sessions').insert({
    session_id: _sessionId,
    started_at: new Date().toISOString(),
    gender: g === 'm' ? 'male' : 'female',
    device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    last_card: 'Sexo'
  }).then(function(){}).catch(function(){});
}
function trackQuestion(idx) {
  var sb = _getSB(); if (!sb || !_sessionId) return;
  sb.from('fitness_quiz_sessions').update({ last_card: 'Q'+(idx+1)+'/7', answers: _sessionAnswers })
    .eq('session_id', _sessionId).then(function(){}).catch(function(){});
}
function trackResult(winner) {
  var sb = _getSB(); if (!sb || !_sessionId) return;
  sb.from('fitness_quiz_sessions').update({
    completed_at: new Date().toISOString(),
    profile_result: winner,
    last_card: 'Resultado',
    answers: _sessionAnswers
  }).eq('session_id', _sessionId).then(function(){}).catch(function(){});
}
function trackCTA() {
  var sb = _getSB(); if (!sb || !_sessionId) return;
  sb.from('fitness_quiz_sessions').update({ cta_clicked_at: new Date().toISOString() })
    .eq('session_id', _sessionId).then(function(){}).catch(function(){});
}
// ─────────────────────────────────────────────────────────────────────────────

`;

html = html.replace('var genero = \'\';', trackingBlock + 'var genero = \'\';');

// ── 3. Hook em iniciarQuiz: chama trackStart ────────────────────────────────
html = html.replace(
  'function iniciarQuiz(g) {\n  genero = g;',
  'function iniciarQuiz(g) {\n  trackStart(g);\n  genero = g;'
);

// ── 4. Hook em mostrarPergunta: registra qual questão está sendo exibida ────
html = html.replace(
  'function mostrarPergunta() {\n  if (qAtual >= perguntas.length) { mostrarLoading(); return; }\n  var q = perguntas[qAtual];\n  atualizarProgresso();',
  'function mostrarPergunta() {\n  if (qAtual >= perguntas.length) { mostrarLoading(); return; }\n  var q = perguntas[qAtual];\n  atualizarProgresso();\n  trackQuestion(qAtual);'
);

// ── 5. Hook em selecionarOpcao: salva resposta escolhida ────────────────────
html = html.replace(
  '  Object.keys(o.s).forEach(function(k){ scores[k] += o.s[k]; });\n  historico.push(qAtual);\n  qAtual++;',
  '  Object.keys(o.s).forEach(function(k){ scores[k] += o.s[k]; });\n  _sessionAnswers[\'q\'+(qAtual+1)] = i;\n  historico.push(qAtual);\n  qAtual++;'
);

// ── 6. Hook em mostrarResultado: registra perfil final ──────────────────────
html = html.replace(
  '  var winner = keys.reduce(function(a,b){ return scores[a]>=scores[b]?a:b });\n  var p = perfis[winner];',
  '  var winner = keys.reduce(function(a,b){ return scores[a]>=scores[b]?a:b });\n  trackResult(winner);\n  var p = perfis[winner];'
);

// ── 7. Adiciona trackCTA() no botão de compra ───────────────────────────────
html = html.replace(
  '<a href="https://pay.hotmart.com/J105842092Y?checkoutMode=10" class="cta-btn" style="margin-top:8px">',
  '<a href="https://pay.hotmart.com/J105842092Y?checkoutMode=10" class="cta-btn" style="margin-top:8px" onclick="trackCTA()">'
);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Done!');

// Página /agendar: monta o seletor de horários (js/agendador.js) em #agendador.
// O token vem do fragmento capturado no <head> (sessionStorage), nunca da URL.
import { iniciarAgendador } from './agendador.js';

iniciarAgendador({ alvo: document.getElementById('agendador') });

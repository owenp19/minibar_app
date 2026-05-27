const FAQ = [
  {
    q: "¿Cómo funciona esta aplicación?",
    a: "Minibar Nattivo te permite registrar consumos de minibar por habitación. Seleccionas la habitación, marcas los productos consumidos, y envías el resumen a recepción por WhatsApp. También puedes generar PDF de factura individual o informes por rango de fechas."
  },
  {
    q: "¿Cómo registro un consumo?",
    a: "Ve a la página de Consumo, selecciona una habitación del listado, marca los productos consumidos (ajusta cantidades si es necesario), agrega una nota opcional y haz clic en 'Enviar a recepción'. El sistema registrará el consumo y abrirá WhatsApp con el resumen."
  },
  {
    q: "¿Cómo envío por WhatsApp?",
    a: "Una vez seleccionados los productos, haz clic en 'Enviar a recepción'. Se abrirá WhatsApp con un mensaje prearmado que incluye: habitación, productos, cantidades, total y enlace al PDF de la cuenta de cobro."
  },
  {
    q: "¿Qué es el desbloqueo de folio?",
    a: "La herramienta de Desbloqueo de Folio te permite seleccionar una o varias habitaciones y generar un mensaje para solicitar el desbloqueo del folio (por ejemplo, para mantenimiento o salida tardía). Puedes enviarlo por WhatsApp o copiar el mensaje."
  },
  {
    q: "¿Cómo descargo un PDF de consumo?",
    a: "Después de registrar un consumo, el sistema genera automáticamente un PDF con la cuenta de cobro. Puedes acceder al enlace directo que aparece en la respuesta. También puedes generar informes desde la sección 'Informe' seleccionando un rango de fechas."
  },
  {
    q: "¿Qué significa cada KPI?",
    a: "Las tarjetas KPI muestran: Habitación (la habitación seleccionada), Items (cantidad total de productos marcados), Total (suma de precios × cantidades), y Última acción (hora del último cambio)."
  },
  {
    q: "¿Cómo cambio de tema?",
    a: "Puedes cambiar entre tema claro y oscuro desde la página de Configuración. Haz clic en el ícono de engranaje en la barra lateral para acceder."
  },
  {
    q: "¿Puedo seleccionar varias habitaciones?",
    a: "Sí, en la herramienta de Desbloqueo de Folio puedes seleccionar múltiples habitaciones usando Ctrl (Windows) o Cmd (Mac) mientras haces clic."
  },
  {
    q: "¿Los datos se guardan automáticamente?",
    a: "Sí, cada consumo que registras se guarda inmediatamente en la base de datos. El PDF de factura se genera bajo demanda al acceder al enlace."
  },
];

(function () {
  if (document.getElementById("chatbot-root")) return;

  const container = document.createElement("div");
  container.id = "chatbot-root";
  container.style.display = "contents";
  container.innerHTML = `
    <link rel="stylesheet" href="/css/chatbot.css">
    <button class="chatbot-btn" id="chatbot-toggle" aria-label="Abrir chat de ayuda">
      <img src="/images/Logo_Nattivo_v1.png" alt="Ayuda" class="chatbot-btn-img" />
    </button>
    <div class="chatbot-panel" id="chatbot-panel">
      <div class="chatbot-header">
        <div class="chatbot-header-left">
          <div class="chatbot-header-avatar">
            <i class="ri-customer-service-2-line"></i>
          </div>
          <div>
            <h3>Asistente Minibar</h3>
            <p>Resuelve tus dudas al instante</p>
          </div>
        </div>
        <div class="chatbot-header-actions">
          <button class="chatbot-header-btn" id="chatbot-clear" title="Borrar conversación" aria-label="Borrar conversación">
            <i class="ri-delete-bin-6-line"></i>
          </button>
          <button class="chatbot-header-btn" id="chatbot-close" title="Cerrar" aria-label="Cerrar chat">
            <i class="ri-close-line"></i>
          </button>
        </div>
      </div>
      <div class="chatbot-messages" id="chatbot-messages">
        <div class="chatbot-msg bot">
          ¡Hola! Soy el asistente del Minibar Nattivo. Haz clic en una pregunta rápida o escribe tu consulta.
          <div class="chatbot-msg-time" id="chatbot-init-time"></div>
        </div>
        <div class="chatbot-typing" id="chatbot-typing">
          <div class="chatbot-typing-dot"></div>
          <div class="chatbot-typing-dot"></div>
          <div class="chatbot-typing-dot"></div>
        </div>
      </div>
      <div class="chatbot-questions" id="chatbot-questions"></div>
      <div class="chatbot-input-area">
        <input class="chatbot-input" id="chatbot-input" type="text" placeholder="Escribe tu pregunta…" />
        <button class="chatbot-send" id="chatbot-send" aria-label="Enviar">
          <i class="ri-send-plane-2-line"></i>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  const toggle = document.getElementById("chatbot-toggle");
  const panel = document.getElementById("chatbot-panel");
  const close = document.getElementById("chatbot-close");
  const clear = document.getElementById("chatbot-clear");
  const messages = document.getElementById("chatbot-messages");
  const input = document.getElementById("chatbot-input");
  const send = document.getElementById("chatbot-send");
  const questionsContainer = document.getElementById("chatbot-questions");
  const typing = document.getElementById("chatbot-typing");
  const initTime = document.getElementById("chatbot-init-time");

  initTime.textContent = nowLabel();

  function renderQuickQuestions() {
    questionsContainer.innerHTML = "";
    FAQ.slice(0, 4).forEach(function (faq) {
      var btn = document.createElement("button");
      btn.className = "chatbot-question-btn";
      btn.textContent = faq.q.length > 40 ? faq.q.substring(0, 40) + "…" : faq.q;
      btn.addEventListener("click", function () { handleUserMessage(faq.q); });
      questionsContainer.appendChild(btn);
    });
  }

  function nowLabel() {
    return new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  }

  function addMessage(text, type) {
    var div = document.createElement("div");
    div.className = "chatbot-msg " + type;
    div.innerHTML = text + '<div class="chatbot-msg-time">' + nowLabel() + "</div>";
    messages.insertBefore(div, typing);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping(show) {
    typing.classList.toggle("visible", show);
    if (show) messages.scrollTop = messages.scrollHeight;
  }

  function findAnswer(query) {
    var q = query.toLowerCase().trim();
    var best = null;
    var bestScore = 0;

    for (var i = 0; i < FAQ.length; i++) {
      var faq = FAQ[i];
      var keywords = faq.q.toLowerCase();
      var score = 0;
      var words = q.split(/\s+/);

      for (var j = 0; j < words.length; j++) {
        if (words[j].length < 3) continue;
        if (keywords.indexOf(words[j]) !== -1) score += 2;
      }

      if (q.indexOf(keywords) !== -1 || keywords.indexOf(q) !== -1) score += 5;

      if (score > bestScore) {
        bestScore = score;
        best = faq;
      }
    }

    return best;
  }

  function handleUserMessage(text) {
    var msg = String(text || "").trim();
    if (!msg) return;

    addMessage(msg, "user");
    input.value = "";

    showTyping(true);

    var answer = findAnswer(msg);
    setTimeout(function () {
      showTyping(false);
      if (answer && answer.a) {
        addMessage(answer.a, "bot");
      } else {
        var suggestions = [];
        for (var i = 0; i < FAQ.length; i++) {
          suggestions.push(FAQ[i].q);
        }
        addMessage(
          'No encontré una respuesta exacta para "<strong>' + msg + '</strong>".<br><br>Prueba con una de estas preguntas:<br>• ' + suggestions.join(".<br>• ") + ".",
          "bot"
        );
      }
    }, 800);
  }

  function clearConversation() {
    var botMessages = messages.querySelectorAll(".chatbot-msg");
    for (var i = 1; i < botMessages.length; i++) {
      botMessages[i].remove();
    }
    var firstMsg = messages.querySelector(".chatbot-msg.bot");
    if (firstMsg) firstMsg.innerHTML = "¡Hola! ¿En qué puedo ayudarte?<div class=\"chatbot-msg-time\">" + nowLabel() + "</div>";
    showTyping(false);
  }

  function togglePanel(open) {
    if (open === undefined) {
      panel.classList.toggle("open");
    } else if (open) {
      panel.classList.add("open");
    } else {
      panel.classList.remove("open");
    }
  }

  toggle.addEventListener("click", function () {
    togglePanel();
    if (panel.classList.contains("open")) renderQuickQuestions();
  });

  close.addEventListener("click", function () { togglePanel(false); });

  clear.addEventListener("click", clearConversation);

  send.addEventListener("click", function () { handleUserMessage(input.value); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") handleUserMessage(input.value);
  });
})();

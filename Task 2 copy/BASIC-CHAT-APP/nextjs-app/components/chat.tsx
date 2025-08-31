"use client";

import { useState } from "react";

export function Chat() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="chat-interface">
      {error && <div className="alert alert-error">{error}</div>}
      {response && <div className="chat-response">{response}</div>}
      <div className="chat-input-container">
        <input
          disabled={loading}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="form-input chat-input"
          placeholder="Ask me anything..."
        />
        <button
          disabled={loading}
          className="btn btn-primary chat-send-btn"
          onClick={() => {
            setLoading(true);
            setMessage("");
            fetch("/api/chat", {
              method: "POST",
              body: JSON.stringify({
                message,
              }),
            })
              .then(async (res) => {
                if (res.ok) {
                  await res.json().then((data) => {
                    setError("");
                    setResponse(data.message);
                  });
                } else {
                  await res.json().then((data) => {
                    setError(data.error);
                    setResponse("");
                  });
                }
              })
              .finally(() => setLoading(false));
          }}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

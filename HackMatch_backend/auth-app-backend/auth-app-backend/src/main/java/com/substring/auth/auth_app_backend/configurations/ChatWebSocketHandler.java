package com.substring.auth.auth_app_backend.configurations;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.substring.auth.auth_app_backend.entities.Message;
import com.substring.auth.auth_app_backend.entities.User;
import com.substring.auth.auth_app_backend.repositories.MessageRepository;
import com.substring.auth.auth_app_backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String query = session.getUri().getQuery();
        if (query != null && query.contains("userId=")) {
            String userId = query.split("userId=")[1].split("&")[0];
            sessions.put(userId, session);
            System.out.println("✅ User connected to WebSocket: " + userId);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Map<String, Object> payload = objectMapper.readValue(message.getPayload(), Map.class);
        String type = (String) payload.getOrDefault("type", "CHAT");

        if ("CHAT".equals(type) || payload.get("content") != null) {
            handleChatMessage(payload);
        }
    }

    private void handleChatMessage(Map<String, Object> data) {
        try {
            String senderId = (String) data.get("senderId");
            String receiverId = (String) data.get("receiverId");
            String content = (String) data.get("content");

            User sender = userRepository.findById(UUID.fromString(senderId)).orElse(null);
            User receiver = userRepository.findById(UUID.fromString(receiverId)).orElse(null);

            if (sender != null && receiver != null) {
                // Save to DB
                Message msg = Message.builder()
                        .sender(sender)
                        .receiver(receiver)
                        .content(content)
                        .build();
                messageRepository.save(msg);

                // Send to receiver if online
                WebSocketSession receiverSession = sessions.get(receiverId);
                if (receiverSession != null && receiverSession.isOpen()) {
                    Map<String, Object> response = Map.of(
                            "id", msg.getId().toString(),
                            "senderId", senderId,
                            "senderName", sender.getName(),
                            "receiverId", receiverId,
                            "content", content,
                            "timestamp", msg.getTimestamp().toString()
                    );
                    receiverSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
                }
            }
        } catch (Exception e) {
            System.err.println("🔥 WebSocket Message Error: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.values().remove(session);
        System.out.println("❌ WebSocket session closed: " + session.getId());
    }
    
    // For Notifications
    public void sendNotification(String userId, Map<String, Object> data) {
        try {
            WebSocketSession session = sessions.get(userId);
            if (session != null && session.isOpen()) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(data)));
            }
        } catch (Exception e) {
            System.err.println("🔥 Failed to send notification: " + e.getMessage());
        }
    }
}

package com.substring.auth.auth_app_backend.configurations;

import com.corundumstudio.socketio.SocketConfig;
import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PreDestroy;

@Configuration
public class SocketIoConfig {
    private SocketIOServer server;

    @Bean
    public SocketIOServer socketIoServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();

        config.setHostname("0.0.0.0");
        config.setPort(9092);

        config.setOrigin("https://hack-match-pied.vercel.app");

        SocketConfig socketConfig = new SocketConfig();

        socketConfig.setReuseAddress(true);

        config.setSocketConfig(socketConfig);

        this.server = new SocketIOServer(config);
        server.start();
        System.out.println("Socket.IO Server started on port 9092");
        return server;
    }

    @PreDestroy
    public void stopSocketServer() {
        if (this.server != null) {
            this.server.stop();
        }
    }

}

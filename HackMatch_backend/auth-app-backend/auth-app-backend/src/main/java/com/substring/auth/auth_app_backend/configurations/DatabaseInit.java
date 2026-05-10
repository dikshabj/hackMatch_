package com.substring.auth.auth_app_backend.configurations;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInit {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseInit.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private com.substring.auth.auth_app_backend.repositories.RoleRepository roleRepository;

    @PostConstruct
    public void init() {
        try {
            logger.info("Running custom database initialization...");
            // Ensure users_skills table exists
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS users_skills (" +
                    "user_id binary(16) NOT NULL, " +
                    "skill varchar(255))");
            
            // Seed Roles Safely using Repository
            seedRole("ROLE_STUDENT");
            seedRole("ROLE_ORGANIZER");
            seedRole("ROLE_SPONSOR");
            
            logger.info("Database initialization completed successfully.");
        } catch (Exception e) {
            logger.error("Failed to initialize database: ", e);
        }
    }

    private void seedRole(String roleName) {
        try {
            if (roleRepository.findByName(roleName).isEmpty()) {
                com.substring.auth.auth_app_backend.entities.Role role = 
                    com.substring.auth.auth_app_backend.entities.Role.builder()
                        .name(roleName)
                        .build();
                roleRepository.save(role);
                logger.info("Seeded role: {}", roleName);
            }
        } catch (Exception e) {
            logger.warn("Could not seed role {}: {}", roleName, e.getMessage());
        }
    }
}

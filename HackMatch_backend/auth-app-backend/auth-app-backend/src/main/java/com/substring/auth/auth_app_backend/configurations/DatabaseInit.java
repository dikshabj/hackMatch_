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

    @PostConstruct
    public void init() {
        try {
            logger.info("Running custom database initialization...");
            // Ensure users_skills table exists
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS users_skills (" +
                    "user_id binary(16) NOT NULL, " +
                    "skill varchar(255))");
            logger.info("Successfully ensured users_skills table exists.");

            // Seed Roles
            seedRole("ROLE_STUDENT");
            seedRole("ROLE_ORGANIZER");
            seedRole("ROLE_SPONSOR");

        } catch (Exception e) {
            logger.error("Failed to initialize database: ", e);
        }
    }

    private void seedRole(String roleName) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM roles WHERE name = ?", Integer.class, roleName);
            
            if (count == null || count == 0) {
                jdbcTemplate.update("INSERT INTO roles (id, name) VALUES (?, ?)", 
                    java.util.UUID.randomUUID().toString(), roleName);
                logger.info("Seeded role: {}", roleName);
            }
        } catch (Exception e) {
            logger.warn("Could not seed role {}: {}", roleName, e.getMessage());
        }
    }
}

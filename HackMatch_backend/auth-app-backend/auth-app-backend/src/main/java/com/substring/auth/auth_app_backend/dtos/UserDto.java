package com.substring.auth.auth_app_backend.dtos;

import com.substring.auth.auth_app_backend.entities.Provider;
import lombok.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDto {

    private UUID id;
    private String email;
    private String username;
    private String name;
    private String password;
    private String image;
    private boolean enable = true;
    private Instant createdAt;
    private Instant updatedAt;

    private Provider provider = Provider.LOCAL;
    private Set<RoleDto> roles = new HashSet<>();

    private String bio;
    private Set<String> skills = new HashSet<>();
    private String githubLink;
    private String linkedinLink;

    // Enhanced Matching Fields
    private String experienceLevel;
    private String preferredRole;
    private boolean available;
    private String portfolioLink;

    // Transient field for AI match explanation
    private String matchReason;
    
    // Transient field for connection status with current user
    private String connectionStatus; // PENDING, ACCEPTED, REJECTED, NONE
}

package com.substring.auth.auth_app_backend.entities;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder

@Entity()
@Table(name="users")
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id")
    private UUID id;
    @Column(name = "user_email", unique = true)
    private String email;
    @Column(name = "username", unique = true)
    private String username;
    @Column(name = "user_name", length = 500)
    private String name;
    private String password;
    private String image;
    private boolean enable=true;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

//    private String gender;
//    private Address address;
    @Enumerated(EnumType.STRING)
    private Provider provider=Provider.LOCAL;
    private String providerId;
//relations in db :
    @ManyToMany(fetch = FetchType.EAGER)
    //jab hm user ko fetch krege usi time hmari rows b ajaye
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();


    @PrePersist
    protected void onCreate(){
        Instant now = Instant.now();
        if(createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate(){
        updatedAt = Instant.now();
    }


    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles
                .stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .toList();
    }

    @Override
    public String getUsername() {
        return this.email;
    }
    @Column(length = 1000)
    private String bio;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "users_skills", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "skill")
    private Set<String> skills = new HashSet<>();

    private String githubLink;
    private String linkedinLink;

    // New fields for enhanced matching
    private String experienceLevel; // Junior, Intermediate, Senior
    private String preferredRole;  // Frontend, Backend, Fullstack, UI/UX
    
    @Builder.Default
    private boolean available = true;
    
    private String portfolioLink;



}

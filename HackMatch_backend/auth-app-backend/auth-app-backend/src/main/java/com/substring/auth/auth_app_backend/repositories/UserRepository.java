package com.substring.auth.auth_app_backend.repositories;

import com.substring.auth.auth_app_backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;
import java.util.List;
import java.util.Set;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    Optional<User> findByUsername(String username);

    List<User> findBySkillsIn(Set<String> skills);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "EXISTS (SELECT s FROM u.skills s WHERE LOWER(s) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<User> findBySkillsOrName(@Param("query") String query);
}

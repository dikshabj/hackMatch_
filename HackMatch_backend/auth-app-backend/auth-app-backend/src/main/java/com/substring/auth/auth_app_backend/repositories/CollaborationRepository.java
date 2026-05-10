package com.substring.auth.auth_app_backend.repositories;

import com.substring.auth.auth_app_backend.entities.CollaborationRequest;
import com.substring.auth.auth_app_backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CollaborationRepository extends JpaRepository<CollaborationRequest, UUID> {
    List<CollaborationRequest> findByReceiver(User receiver);
    List<CollaborationRequest> findBySender(User sender);

    boolean existsBySenderAndReceiver(User sender, User receiver);

    @org.springframework.data.jpa.repository.Query("SELECT cr FROM CollaborationRequest cr WHERE (cr.sender = :user1 AND cr.receiver = :user2) OR (cr.sender = :user2 AND cr.receiver = :user1)")
    java.util.Optional<CollaborationRequest> findRequestBetweenUsers(@org.springframework.data.repository.query.Param("user1") User user1, @org.springframework.data.repository.query.Param("user2") User user2);

    @org.springframework.data.jpa.repository.Query("SELECT cr FROM CollaborationRequest cr WHERE (cr.sender = :user OR cr.receiver = :user) AND cr.status = com.substring.auth.auth_app_backend.entities.RequestStatus.ACCEPTED")
    List<CollaborationRequest> findAcceptedConnections(@org.springframework.data.repository.query.Param("user") User user);
}

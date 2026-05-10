package com.substring.auth.auth_app_backend.services.impel;

import com.substring.auth.auth_app_backend.configurations.ChatWebSocketHandler;

import com.substring.auth.auth_app_backend.dtos.CollaborationRequestDto;
import com.substring.auth.auth_app_backend.entities.CollaborationRequest;
import com.substring.auth.auth_app_backend.entities.RequestStatus;
import com.substring.auth.auth_app_backend.entities.User;
import com.substring.auth.auth_app_backend.helpers.UserHelper;
import com.substring.auth.auth_app_backend.repositories.CollaborationRepository;
import com.substring.auth.auth_app_backend.repositories.UserRepository;
import com.substring.auth.auth_app_backend.services.CollaborationService;
import com.substring.auth.auth_app_backend.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.List;
import java.util.UUID;
@Service
@RequiredArgsConstructor
public class CollaborationServiceImpel implements CollaborationService {
    private final CollaborationRepository collaborationRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final ChatWebSocketHandler socketHandler;
    private final NotificationService notificationService;

    @Override
    public CollaborationRequestDto sendRequest(String senderEmail, String receiverId , String message){
        User sender = userRepository.findByEmail(senderEmail).orElseThrow();

        User receiver = userRepository.findById(UserHelper.parseUUID(receiverId)).orElseThrow();
        
        // Check if request already exists in either direction
        if (collaborationRepository.existsBySenderAndReceiver(sender, receiver) || 
            collaborationRepository.existsBySenderAndReceiver(receiver, sender)) {
            throw new RuntimeException("A neural link sequence is already active or pending with this operative.");
        }

        CollaborationRequest request = CollaborationRequest.builder()
        .sender(sender)
        .receiver(receiver)
        .message(message)
        .status(RequestStatus.PENDING)
        .build();

        CollaborationRequest savedRequest = collaborationRepository.save(request);

        // Create notification for receiver
        notificationService.createNotification(
                receiver,
                "New Connection Request",
                sender.getName() + " wants to connect with you.",
                "CONNECTION_REQUEST",
                "/notifications"
        );

        return modelMapper.map(savedRequest, CollaborationRequestDto.class);

    }

    @Override
    public List<CollaborationRequestDto> getReceivedRequests(String userEmail){
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        return collaborationRepository.findByReceiver(user).stream()
        .map(req -> modelMapper.map(req, CollaborationRequestDto.class))
        .toList();

    }

    @Override
    public List<CollaborationRequestDto> getSentRequests(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        return collaborationRepository.findBySender(user).stream()
                .map(req -> modelMapper.map(req, CollaborationRequestDto.class))
                .toList();
    }

    @Override
public CollaborationRequestDto updateRequestStatus(String requestId, String status) {
    CollaborationRequest request = collaborationRepository.findById(UUID.fromString(requestId))
            .orElseThrow(() -> new RuntimeException("Request not found"));

    try {
        request.setStatus(RequestStatus.valueOf(status.toUpperCase()));
    } catch (IllegalArgumentException e) {
        throw new RuntimeException("Invalid Status: " + status);
    }

    CollaborationRequest savedRequest = collaborationRepository.save(request);

    // Trigger Notification if Accepted
    if (savedRequest.getStatus() == RequestStatus.ACCEPTED) {
        notificationService.createNotification(
                savedRequest.getSender(),
                "Connection Accepted",
                savedRequest.getReceiver().getName() + " accepted your connection request.",
                "CONNECTION_ACCEPTED",
                "/messages"
        );
    }

    return modelMapper.map(savedRequest, CollaborationRequestDto.class);
}

    @Override
    public List<CollaborationRequestDto> getAcceptedConnections(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        return collaborationRepository.findAcceptedConnections(user).stream()
                .map(req -> modelMapper.map(req, CollaborationRequestDto.class))
                .toList();
    }
}

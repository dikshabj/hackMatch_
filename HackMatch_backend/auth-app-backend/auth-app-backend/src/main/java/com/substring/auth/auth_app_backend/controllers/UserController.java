package com.substring.auth.auth_app_backend.controllers;

import com.substring.auth.auth_app_backend.dtos.UserDto;
import com.substring.auth.auth_app_backend.services.ProfileSyncService;
import com.substring.auth.auth_app_backend.services.S3Service;
import com.substring.auth.auth_app_backend.services.UserService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@AllArgsConstructor
public class UserController {
    private final UserService userService;
    private final S3Service s3Service;
    private final ProfileSyncService profileSyncService;

    @PostMapping("/sync")
    public ResponseEntity<UserDto> syncProfile(Principal principal) {
        return ResponseEntity.ok(profileSyncService.syncUserProfile(principal.getName()));
    }

    @PostMapping
    public ResponseEntity<UserDto> createUser(@RequestBody UserDto userDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(userDto));
    }

    @GetMapping
    public ResponseEntity<Iterable<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserDto> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @DeleteMapping("/{userId}")
    public void deleteUser(@PathVariable("userId") String userId) {
        userService.deleteUser(userId);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserDto> updateUser(@RequestBody UserDto userDto, @PathVariable("userId") String userId) {
        return ResponseEntity.ok(userService.updateUser(userDto, userId));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getLoggedInUser(Principal principal){
        return ResponseEntity.ok(userService.getUserByEmail(principal.getName()));
    }

    @PostMapping("/upload-image")
    public ResponseEntity<Map<String, String>> uploadProfilePicture(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            Principal principal) throws java.io.IOException {
        
        String imageUrl = s3Service.uploadImage(file);
        
        // Update user in DB
        UserDto user = userService.getUserByEmail(principal.getName());
        user.setImage(imageUrl);
        userService.updateUser(user, user.getId().toString());
        
        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }
}

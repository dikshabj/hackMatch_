package com.substring.auth.auth_app_backend.controllers;

import com.substring.auth.auth_app_backend.dtos.UserDto;
import com.substring.auth.auth_app_backend.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/matches")
@RequiredArgsConstructor
public class MatchController {

    private final UserService userService;

    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchTeammates(
        @RequestParam String query,
        Principal principal
    ){
        return ResponseEntity.ok(userService.findTeammatesBySkills(query, principal.getName()));
    }

        // Is method ko MatchController mein add karein:

    @GetMapping("/suggestions")
    public ResponseEntity<List<UserDto>> getSuggestions(Principal principal) {
        // principal.getName() se humein current user ki email mil jayegi
        return ResponseEntity.ok(userService.getSuggestedTeammates(principal.getName()));
    }

    
}

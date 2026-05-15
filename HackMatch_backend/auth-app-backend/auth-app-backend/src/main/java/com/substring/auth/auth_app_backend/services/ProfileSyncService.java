package com.substring.auth.auth_app_backend.services;

import com.substring.auth.auth_app_backend.dtos.UserDto;
import com.substring.auth.auth_app_backend.entities.User;
import com.substring.auth.auth_app_backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileSyncService {

    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ModelMapper modelMapper;

    public UserDto syncUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Sync GitHub if username exists
        if (user.getGithubUsername() != null && !user.getGithubUsername().isEmpty()) {
            try {
                String githubUrl = "https://api.github.com/users/" + user.getGithubUsername();
                Map<String, Object> githubData = restTemplate.getForObject(githubUrl, Map.class);
                
                if (githubData != null) {
                    Map<String, Integer> stats = new HashMap<>();
                    stats.put("repos", (Integer) githubData.get("public_repos"));
                    stats.put("followers", (Integer) githubData.get("followers"));
                    stats.put("gists", (Integer) githubData.get("public_gists"));
                    user.setGithubStats(stats);
                    
                    // Simple XP: 10 per repo, 5 per follower
                    long newXp = (stats.get("repos") * 10L) + (stats.get("followers") * 5L);
                    user.setXp(user.getXp() + newXp);
                }
            } catch (Exception e) {
                System.err.println("GitHub Sync Failed for " + user.getGithubUsername() + ": " + e.getMessage());
            }
        }

        // 2. Sync LeetCode if username exists
        if (user.getLeetcodeUsername() != null && !user.getLeetcodeUsername().isEmpty()) {
            try {
                String leetcodeUrl = "https://leetcode-api-faisalshohag.vercel.app/" + user.getLeetcodeUsername();
                Map<String, Object> leetcodeData = restTemplate.getForObject(leetcodeUrl, Map.class);
                
                if (leetcodeData != null && leetcodeData.containsKey("totalSolved")) {
                    Map<String, Integer> stats = new HashMap<>();
                    stats.put("total", (Integer) leetcodeData.get("totalSolved"));
                    stats.put("easy", (Integer) leetcodeData.get("easySolved"));
                    stats.put("medium", (Integer) leetcodeData.get("mediumSolved"));
                    stats.put("hard", (Integer) leetcodeData.get("hardSolved"));
                    user.setLeetcodeStats(stats);
                    
                    // LeetCode XP: 5 per easy, 15 per medium, 30 per hard
                    long lcXp = (stats.get("easy") * 5L) + 
                                (stats.get("medium") * 15L) + 
                                (stats.get("hard") * 30L);
                    user.setXp(user.getXp() + lcXp);
                }
            } catch (Exception e) {
                System.err.println("LeetCode Sync Failed for " + user.getLeetcodeUsername() + ": " + e.getMessage());
            }
        }

        // 3. Update Rank based on total XP
        user.setUserRank(calculateRank(user.getXp()));
        user.setLastSync(Instant.now());

        User savedUser = userRepository.save(user);
        return modelMapper.map(savedUser, UserDto.class);
    }

    private String calculateRank(long xp) {
        if (xp < 500) return "Rookie";
        if (xp < 2000) return "Code Ninja";
        if (xp < 5000) return "Binary Beast";
        if (xp < 10000) return "Logic Legend";
        return "HackMaster";
    }
}

package com.substring.auth.auth_app_backend.services.impel;

import com.substring.auth.auth_app_backend.dtos.UserDto;
import com.substring.auth.auth_app_backend.entities.Provider;
import com.substring.auth.auth_app_backend.entities.Role;
import com.substring.auth.auth_app_backend.entities.User;
import com.substring.auth.auth_app_backend.exceptions.ResourceNotFound;
import com.substring.auth.auth_app_backend.helpers.UserHelper;
import com.substring.auth.auth_app_backend.repositories.RoleRepository;
import com.substring.auth.auth_app_backend.repositories.UserRepository;
import com.substring.auth.auth_app_backend.repositories.CollaborationRepository;
import com.substring.auth.auth_app_backend.services.AIService;
import com.substring.auth.auth_app_backend.services.MatchService;
import com.substring.auth.auth_app_backend.services.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpel implements UserService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    private final RoleRepository roleRepository;
    private final AIService aiService;
    private final MatchService matchService;
    private final CollaborationRepository collaborationRepository;



    @Override
    @Transactional
    public UserDto createUser(UserDto userDto) {
        //validate
        if(userDto.getEmail() == null || userDto.getEmail().isBlank()){
            throw new IllegalArgumentException("Email is required!");
        }

        if(userRepository.existsByEmail(userDto.getEmail())){
            throw new IllegalArgumentException("Email already exists!");
        }

        //extra checks so put here
        User user = modelMapper.map(userDto, User.class);

        //ROLE ASSIGN FOR NEW USER
        // Check if frontend ne koi specific role bheja hai (e.g., ROLE_ORGANIZER)
        boolean wantsOrganizer = userDto.getRoles() != null &&
            userDto.getRoles().stream().anyMatch(r -> "ROLE_ORGANIZER".equals(r.getName()));

        String roleName = wantsOrganizer ? "ROLE_ORGANIZER" : "ROLE_STUDENT";
        Role assignedRole = roleRepository.findByName(roleName)
            .orElseThrow(() -> new ResourceNotFound("Role not found: " + roleName));
        user.setRoles(Set.of(assignedRole));

        // Handle Username
        if (userDto.getUsername() == null || userDto.getUsername().isBlank()) {
            String baseUsername = userDto.getEmail().split("@")[0].replaceAll("[^a-zA-Z0-9]", "_");
            String generatedUsername = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsername(generatedUsername)) {
                generatedUsername = baseUsername + counter++;
            }
            user.setUsername(generatedUsername);
        } else {
            if (userRepository.existsByUsername(userDto.getUsername())) {
                throw new IllegalArgumentException("Username already exists!");
            }
            user.setUsername(userDto.getUsername());
        }

        user.setProvider(userDto.getProvider()!= null ? userDto.getProvider(): Provider.LOCAL);
        //role assign to new user for authorization
        User savedUser = userRepository.save(user);

        return modelMapper.map(savedUser, UserDto.class);
    }

    @Override
    public UserDto getUserByEmail(String email) {
        User user = userRepository
                .findByEmail(email)
                .orElseThrow(()-> new ResourceNotFound("User not found "+ email));
        return modelMapper.map(user , UserDto.class);
    }





    @Override
    public void deleteUser(String userId) {
        UUID uId = UserHelper.parseUUID(userId);
        User user = userRepository.findById(uId)
                .orElseThrow(()-> new ResourceNotFound("User not found with given id"));
        userRepository.delete(user);

    }

    @Override
    public UserDto getUserById(String userId) {
        User user = userRepository.findById(UserHelper.parseUUID(userId))
                .orElseThrow(()-> new ResourceNotFound("User id not found!"));
        return modelMapper.map(user , UserDto.class);
    }

    @Override
    public UserDto updateUser(UserDto userDto, String userId ){
        UUID uId = UserHelper.parseUUID(userId);
        User existingUser = userRepository.findById(uId)
                .orElseThrow(()-> new ResourceNotFound("User not found!"));

        //fields update krna
        if(userDto.getName() != null) existingUser.setName(userDto.getName());
        if(userDto.getUsername() != null && !userDto.getUsername().equals(existingUser.getUsername())) {
            if(userRepository.existsByUsername(userDto.getUsername())) {
                throw new IllegalArgumentException("Username already exists!");
            }
            existingUser.setUsername(userDto.getUsername());
        }
        if(userDto.getImage() != null) existingUser.setImage(userDto.getImage());

        //new fields update
        if(userDto.getBio() != null) existingUser.setBio(userDto.getBio());
        if(userDto.getSkills() != null && !userDto.getSkills().isEmpty()) existingUser.setSkills(userDto.getSkills());
        if(userDto.getGithubLink() != null) existingUser.setGithubLink(userDto.getGithubLink());
        if(userDto.getLinkedinLink() != null ) existingUser.setLinkedinLink(userDto.getLinkedinLink());
        
        // Missing fields fix
        if(userDto.getGithubUsername() != null) existingUser.setGithubUsername(userDto.getGithubUsername());
        if(userDto.getLeetcodeUsername() != null) existingUser.setLeetcodeUsername(userDto.getLeetcodeUsername());
        if(userDto.getPreferredRole() != null) existingUser.setPreferredRole(userDto.getPreferredRole());
        if(userDto.getStatus() != null) existingUser.setStatus(userDto.getStatus());
        if(userDto.getPortfolioLink() != null) existingUser.setPortfolioLink(userDto.getPortfolioLink());

        existingUser.setUpdatedAt(Instant.now());

        User updatedUser = userRepository.save(existingUser);
        return modelMapper.map(updatedUser, UserDto.class);
    }

    @Override
    @Transactional
    public Iterable<UserDto> getAllUsers() {
        return userRepository
                .findAll()
                .stream()
                .map(user -> modelMapper.map(user , UserDto.class))
                .toList();
    }

    @Override
    public List<UserDto> findTeammatesBySkills(String query, String currentUserEmail){
        User currentUser = userRepository.findByEmail(currentUserEmail).orElse(null);
        
        return userRepository.findBySkillsOrName(query)
                .stream()
                .filter(user -> !user.getEmail().equals(currentUserEmail))
                .map(user -> {
                    UserDto dto = modelMapper.map(user , UserDto.class);
                    if (currentUser != null) {
                        collaborationRepository.findRequestBetweenUsers(currentUser, user)
                            .ifPresentOrElse(
                                request -> dto.setConnectionStatus(request.getStatus().name()),
                                () -> dto.setConnectionStatus("NONE")
                            );
                    }
                    return dto;
                })
                .toList();
    }

        @Override
    public List<UserDto> getSuggestedTeammates(String currentUserEmail) {
        // 1. Current user nikalo
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFound("User not found!"));
        
        UserDto currentUserDto = modelMapper.map(currentUser, UserDto.class);

        // 2. Saare potential candidates nikalo (Other students)
        List<UserDto> candidates = userRepository.findAll().stream()
                .filter(user -> !user.getEmail().equals(currentUserEmail))
                .filter(user -> user.getRoles().stream().anyMatch(role -> role.getName().equals("ROLE_STUDENT")))
                .map(user -> modelMapper.map(user, UserDto.class))
                .toList();

        // 3. AI se ranking karwa kar return karein! ✅
        List<UserDto> ranked = aiService.rankTeammatesWithAI(currentUserDto, candidates);
        
        // 4. Match reasons & Connection Status add karein
        ranked.forEach(dto -> {
            User other = userRepository.findById(dto.getId()).orElse(null);
            if (other != null) {
                dto.setMatchReason(matchService.getMatchReason(currentUser, other));
                
                // Connection status check
                collaborationRepository.findRequestBetweenUsers(currentUser, other)
                        .ifPresentOrElse(
                            request -> dto.setConnectionStatus(request.getStatus().name()),
                            () -> dto.setConnectionStatus("NONE")
                        );
            }
        });
        
        return ranked;
    }



       

}

package com.substring.auth.auth_app_backend.security;

import com.substring.auth.auth_app_backend.entities.Provider;
import com.substring.auth.auth_app_backend.entities.Role;
import com.substring.auth.auth_app_backend.entities.User;
import com.substring.auth.auth_app_backend.repositories.RoleRepository;
import com.substring.auth.auth_app_backend.repositories.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class CustomOAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(CustomOAuth2SuccessHandler.class);

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        try {
            logger.info("--- [OAUTH2 SUCCESS HANDLER START] ---");
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
            String registrationId = oauthToken.getAuthorizedClientRegistrationId();
            OAuth2User oauthUser = oauthToken.getPrincipal();

            logger.info("[STEP 1] Provider: {}", registrationId);
            
            String email = oauthUser.getAttribute("email");
            String name = oauthUser.getAttribute("name");
            String login = oauthUser.getAttribute("login");
            String image = "";
            String providerId = "";

            Provider provider = Provider.LOCAL;

            if (registrationId.equalsIgnoreCase("google")) {
                provider = Provider.GOOGLE;
                providerId = oauthUser.getAttribute("sub");
                image = oauthUser.getAttribute("picture");
            } else if (registrationId.equalsIgnoreCase("github")) {
                provider = Provider.GITHUB;
                providerId = String.valueOf(oauthUser.getAttribute("id"));
                image = oauthUser.getAttribute("avatar_url");
                if (name == null) {
                    name = login;
                }
                // GitHub email is often null if private
                if (email == null) {
                    email = login + "@github.com";
                    logger.warn("[STEP 2] GitHub Email is private, using generated email: {}", email);
                }
            }

            if (email == null || email.isEmpty()) {
                throw new RuntimeException("Could not retrieve email from " + registrationId + ". Please make sure your email is public in GitHub settings.");
            }

            logger.info("[STEP 3] Final Identity: {} ({})", email, name);

            // Logic to find or create user
            final String finalEmail = email;
            logger.info("[STEP 4] Searching for user in DB: {}", finalEmail);
            User user = userRepository.findByEmail(finalEmail).orElse(null);

            if (user == null) {
                logger.info("[STEP 4.1] User not found, fetching ROLE_STUDENT");
                Role userRole = roleRepository.findByName(Role.STUDENT).orElse(null);
                
                if (userRole == null) {
                    logger.warn("[WARNING] ROLE_STUDENT not found! Creating it now...");
                    userRole = Role.builder().name(Role.STUDENT).build();
                    userRole = roleRepository.save(userRole);
                }

                // Generate Unique Username
                String baseUsername = finalEmail.split("@")[0].replaceAll("[^a-zA-Z0-9]", "_");
                String generatedUsername = baseUsername;
                int counter = 1;
                while (userRepository.existsByUsername(generatedUsername)) {
                    generatedUsername = baseUsername + counter++;
                }

                logger.info("[STEP 4.2] Creating new user object with username: {}", generatedUsername);
                user = User.builder()
                        .email(finalEmail)
                        .username(generatedUsername)
                        .name(name)
                        .image(image)
                        .provider(provider)
                        .providerId(providerId)
                        .password("") // Null ki jagah khali string try karte hain
                        .roles(Set.of(userRole))
                        .enable(true)
                        .build();
                
                try {
                    user = userRepository.save(user);
                    logger.info("[STEP 4.3] User saved successfully with ID: {}", user.getId());
                } catch (Exception saveEx) {
                    logger.error("[ERROR] Failed to save new user to DB: {}", saveEx.getMessage(), saveEx);
                    throw saveEx;
                }
            } else {
                logger.info("[STEP 4] User already exists: {}", user.getEmail());
                if (user.getProvider() == Provider.LOCAL || user.getProviderId() == null) {
                    user.setProvider(provider);
                    user.setProviderId(providerId);
                    user.setImage(image);
                    user = userRepository.save(user);
                    logger.info("[STEP 4.4] Updated existing user with provider info");
                }
            }

            // Generate tokens
            logger.info("[STEP 5] Generating JWT tokens");
            String accessToken = jwtService.generateAccessToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            // Redirect to frontend with tokens
            String targetUrl = frontendUrl + "/login?token=" + accessToken + "&refreshToken=" + refreshToken;
            logger.info("[STEP 6] Redirecting to: {}", targetUrl);
            getRedirectStrategy().sendRedirect(request, response, targetUrl);

        } catch (Exception e) {
            logger.error("\n!!! [OAUTH-ERROR CRITICAL] !!!");
            logger.error("Error Message: {}", e.getMessage());
            e.printStackTrace(); // Full stack trace in logs
            response.sendRedirect(frontendUrl + "/login?error=auth_failed&msg=" + java.net.URLEncoder.encode(e.getMessage(), "UTF-8"));
        }
    }
}

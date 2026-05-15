package com.substring.auth.auth_app_backend.services.impel;

import com.substring.auth.auth_app_backend.entities.Otp;
import com.substring.auth.auth_app_backend.entities.User;
import com.substring.auth.auth_app_backend.repositories.OtpRepository;
import com.substring.auth.auth_app_backend.repositories.UserRepository;
import com.substring.auth.auth_app_backend.services.EmailService;
import com.substring.auth.auth_app_backend.services.ForgotPasswordService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class ForgotPasswordServiceImpel implements ForgotPasswordService {

    private final UserRepository userRepository;
    private final OtpRepository otpRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void sendOtp(String email) {
        // Check if user exists
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User with this email NOT FOUND!"));

        // Generate 6 digit OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));

        // Save OTP to DB (Purane OTPs delete karke)
        otpRepository.deleteByEmail(email);
        
        Otp otpEntity = Otp.builder()
                .email(email)
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(5)) // 5 Minutes expiry
                .build();
        
        otpRepository.save(otpEntity);

        // Send Email
        try {
            String subject = "Password Reset OTP - HackMatch";
            String message = "Your OTP for password reset is: " + otp + ". This OTP is valid for 5 minutes.";
            emailService.sendEmail(email, subject, message);
        } catch (Exception e) {
            throw new RuntimeException("FAILED to send email: " + e.getMessage());
        }
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        Otp otpEntity = otpRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("OTP not found for this email!"));

        if (otpEntity.isExpired()) {
            otpRepository.delete(otpEntity);
            throw new RuntimeException("OTP expired!");
        }

        return otpEntity.getOtp().equals(otp);
    }

    @Override
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        // First verify OTP
        if (verifyOtp(email, otp)) {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found!"));

            // Update Password
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            // Delete OTP after success
            otpRepository.deleteByEmail(email);
        } else {
            throw new RuntimeException("Invalid OTP!");
        }
    }
}

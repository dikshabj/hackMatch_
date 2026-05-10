package com.substring.auth.auth_app_backend.services;

import com.substring.auth.auth_app_backend.dtos.UserDto;
import java.util.List;
import java.util.Set;

public interface UserService {
  // create user
  UserDto createUser(UserDto userDto);

  UserDto getUserByEmail(String email);

  // update user
  UserDto updateUser(UserDto userDto, String userId);

  void deleteUser(String userId);

  UserDto getUserById(String userId);

  Iterable<UserDto> getAllUsers();

  List<UserDto> getSuggestedTeammates(String currentUserEmail);

  List<UserDto> findTeammatesBySkills(String query, String currentUserEmail);
}

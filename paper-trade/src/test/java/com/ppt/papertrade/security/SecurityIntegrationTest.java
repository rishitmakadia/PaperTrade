package com.ppt.papertrade.security;

import com.ppt.papertrade.entity.Role;
import com.ppt.papertrade.entity.User;
import com.ppt.papertrade.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Should permit public health check endpoint without token")
    void testPublicHealth() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    @DisplayName("Should reject unauthenticated requests to protected endpoints with 401 Unauthorized")
    void testUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/portfolio"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should allow authenticated user with valid JWT to access user endpoints")
    void testAuthenticatedUserAccess() throws Exception {
        User user = userRepository.findByEmailIgnoreCase("krunal@example.com").orElseThrow();
        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), Role.USER.name());

        mockMvc.perform(get("/api/portfolio")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should forbid normal user from accessing admin endpoints (403 Forbidden)")
    void testUserAccessAdminForbidden() throws Exception {
        User user = userRepository.findByEmailIgnoreCase("krunal@example.com").orElseThrow();
        String userToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), Role.USER.name());

        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should allow admin user with ROLE_ADMIN to access admin endpoints")
    void testAdminAccessAdminSuccess() throws Exception {
        User admin = userRepository.findByEmailIgnoreCase("admin@alphametrics.in").orElseThrow();
        String adminToken = jwtTokenProvider.generateToken(admin.getId(), admin.getEmail(), Role.ADMIN.name());

        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").exists());
    }
}

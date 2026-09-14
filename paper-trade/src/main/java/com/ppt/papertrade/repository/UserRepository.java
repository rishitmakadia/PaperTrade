package com.ppt.papertrade.repository;

import com.ppt.papertrade.entity.Role;
import com.ppt.papertrade.entity.User;
import com.ppt.papertrade.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(Role role);

    long countByRoleAndStatus(Role role, UserStatus status);

    long countByRoleAndCreatedAtGreaterThanEqual(Role role, Instant startDate);

    List<User> findAllByOrderByCreatedAtDesc();

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.portfolios WHERE u.email = :email")
    Optional<User> findByEmailWithPortfolios(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.portfolios WHERE u.id = :id")
    Optional<User> findByIdWithPortfolios(Long id);
}

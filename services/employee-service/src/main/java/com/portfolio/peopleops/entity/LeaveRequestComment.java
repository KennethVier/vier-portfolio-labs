package com.portfolio.peopleops.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "leave_request_comments")
@Getter
@Setter
@NoArgsConstructor
public class LeaveRequestComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "leave_request_id")
    private LeaveRequest leaveRequest;

    @Column(nullable = false)
    private String authorName;

    @Column(nullable = false)
    private String authorRole;

    @Column(nullable = false, length = 1200)
    private String message;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}

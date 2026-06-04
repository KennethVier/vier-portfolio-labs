package com.portfolio.peopleops.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.portfolio.peopleops.entity.LeaveRequestComment;

public interface LeaveRequestCommentRepository extends JpaRepository<LeaveRequestComment, Long> {
    List<LeaveRequestComment> findByLeaveRequestIdOrderByCreatedAtAsc(Long leaveRequestId);
    long countByLeaveRequestId(Long leaveRequestId);
}

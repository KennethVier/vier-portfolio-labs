package com.portfolio.peopleops.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.portfolio.peopleops.dto.*;
import com.portfolio.peopleops.service.PeopleOpsService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/peopleops/leave-requests")
public class LeaveRequestController {
    private final PeopleOpsService service;

    public LeaveRequestController(PeopleOpsService service) {
        this.service = service;
    }

    @GetMapping
    public List<LeaveRequestDto> requests(@RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long employeeId) {
        return service.getLeaveRequests(status, type, employeeId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeaveRequestDto create(@Valid @RequestBody LeaveRequestCreateRequest request) {
        return service.createLeaveRequest(request);
    }

    @PutMapping("/{id}/review")
    public LeaveRequestDto review(@PathVariable Long id, @Valid @RequestBody LeaveReviewRequest request) {
        return service.reviewLeaveRequest(id, request);
    }

    @GetMapping("/{id}/comments")
    public List<LeaveRequestCommentDto> comments(@PathVariable Long id) {
        return service.getLeaveRequestComments(id);
    }

    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public LeaveRequestCommentDto createComment(@PathVariable Long id, @Valid @RequestBody LeaveRequestCommentRequest request) {
        return service.createLeaveRequestComment(id, request);
    }
}

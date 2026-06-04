package com.portfolio.shop.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portfolio.shop.dto.OrderDto;
import com.portfolio.shop.dto.OrderRequest;
import com.portfolio.shop.service.OrderService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api/orders")
@AllArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderDto> createOrder(@Valid @RequestBody OrderRequest orderRequest) {
        OrderDto createdOrder = orderService.createOrder(orderRequest);
        return ResponseEntity.created(URI.create("/api/orders/" + createdOrder.getId())).body(createdOrder);
    }

    @GetMapping
    public ResponseEntity<List<OrderDto>> getRecentOrders() {
        return ResponseEntity.ok(orderService.getRecentOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrder(id));
    }
}
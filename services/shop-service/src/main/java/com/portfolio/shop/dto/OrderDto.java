package com.portfolio.shop.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.portfolio.shop.model.OrderStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDto {

    private Long id;
    private String customerName;
    private String contactNumber;
    private String deliveryAddress;
    private String paymentMethod;
    private Integer totalAmount;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private List<OrderItemDto> items;
}
package com.portfolio.shop.service;

import java.util.List;

import com.portfolio.shop.dto.OrderDto;
import com.portfolio.shop.dto.OrderRequest;

public interface OrderService {

    OrderDto createOrder(OrderRequest orderRequest);

    List<OrderDto> getRecentOrders();

    OrderDto getOrder(Long id);
}
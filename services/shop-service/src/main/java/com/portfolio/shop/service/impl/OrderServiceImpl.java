package com.portfolio.shop.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.portfolio.shop.dto.OrderDto;
import com.portfolio.shop.dto.OrderItemRequest;
import com.portfolio.shop.dto.OrderRequest;
import com.portfolio.shop.exception.ResourceConflictException;
import com.portfolio.shop.exception.ResourceNotFoundException;
import com.portfolio.shop.mapper.OrderMapper;
import com.portfolio.shop.model.Product;
import com.portfolio.shop.model.ShopOrder;
import com.portfolio.shop.model.ShopOrderItem;
import com.portfolio.shop.repository.ProductRepository;
import com.portfolio.shop.repository.ShopOrderRepository;
import com.portfolio.shop.service.OrderService;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final ShopOrderRepository shopOrderRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public OrderDto createOrder(OrderRequest orderRequest) {
        ShopOrder order = ShopOrder.builder()
                .customerName(orderRequest.getCustomerName())
                .contactNumber(orderRequest.getContactNumber())
                .deliveryAddress(orderRequest.getDeliveryAddress())
                .paymentMethod(orderRequest.getPaymentMethod())
                .totalAmount(0)
                .build();

        int totalAmount = 0;
        for (OrderItemRequest itemRequest : orderRequest.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemRequest.getProductId()));
            if (product.getStocks() < itemRequest.getQuantity()) {
                throw new ResourceConflictException("Insufficient stock for " + product.getProductName());
            }

            int lineTotal = product.getProductPrice() * itemRequest.getQuantity();
            totalAmount += lineTotal;

            product.setStocks(product.getStocks() - itemRequest.getQuantity());

            order.addItem(ShopOrderItem.builder()
                    .productId(product.getId())
                    .productName(product.getProductName())
                    .unitPrice(product.getProductPrice())
                    .quantity(itemRequest.getQuantity())
                    .lineTotal(lineTotal)
                    .imageUrl(product.getImageUrl())
                    .build());
        }

        order.setTotalAmount(totalAmount);
        return OrderMapper.toDto(shopOrderRepository.save(order));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDto> getRecentOrders() {
        return shopOrderRepository.findTop25ByOrderByCreatedAtDesc().stream()
                .map(OrderMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDto getOrder(Long id) {
        return shopOrderRepository.findById(id)
                .map(OrderMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
    }
}
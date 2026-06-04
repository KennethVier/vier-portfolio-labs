package com.portfolio.shop.mapper;

import com.portfolio.shop.dto.OrderDto;
import com.portfolio.shop.dto.OrderItemDto;
import com.portfolio.shop.model.ShopOrder;
import com.portfolio.shop.model.ShopOrderItem;

public final class OrderMapper {

    private OrderMapper() {
    }

    public static OrderDto toDto(ShopOrder order) {
        return OrderDto.builder()
                .id(order.getId())
                .customerName(order.getCustomerName())
                .contactNumber(order.getContactNumber())
                .deliveryAddress(order.getDeliveryAddress())
                .paymentMethod(order.getPaymentMethod())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .items(order.getItems().stream().map(OrderMapper::toDto).toList())
                .build();
    }

    private static OrderItemDto toDto(ShopOrderItem item) {
        return OrderItemDto.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .productName(item.getProductName())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .lineTotal(item.getLineTotal())
                .imageUrl(item.getImageUrl())
                .build();
    }
}
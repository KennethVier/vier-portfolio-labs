package com.portfolio.shop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemDto {

    private Long id;
    private Long productId;
    private String productName;
    private Integer unitPrice;
    private Integer quantity;
    private Integer lineTotal;
    private String imageUrl;
}
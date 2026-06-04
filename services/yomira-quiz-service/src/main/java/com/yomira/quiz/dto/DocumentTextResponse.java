package com.yomira.quiz.dto;

import lombok.Data;

@Data
public class DocumentTextResponse {
	private String documentId;
	private String text;
	private int pageCount;
}

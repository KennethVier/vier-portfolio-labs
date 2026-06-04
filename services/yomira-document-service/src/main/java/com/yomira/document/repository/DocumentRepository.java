package com.yomira.document.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.yomira.document.entity.Document;

public interface DocumentRepository extends JpaRepository<Document, Long>{

}

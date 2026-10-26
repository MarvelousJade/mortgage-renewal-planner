# One same-origin service: Spring Boot serves the compiled Angular application.
FROM node:22-alpine AS frontend-build
WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM maven:3.9.11-eclipse-temurin-21 AS backend-build
WORKDIR /workspace/backend
COPY backend/pom.xml ./
RUN mvn -B -ntp dependency:go-offline
COPY backend/src ./src
COPY --from=frontend-build /workspace/frontend/dist/frontend/browser/ ./src/main/resources/static/
RUN mvn -B -ntp verify

FROM eclipse-temurin:21-jre-jammy
RUN groupadd --system spring && useradd --system --gid spring spring
WORKDIR /app
COPY --from=backend-build /workspace/backend/target/backend-*.jar app.jar
USER spring:spring
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=65.0", "-jar", "/app/app.jar"]

FROM mcr.microsoft.com/devcontainers/go:1.23

# Install additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        postgresql-client-16 \
        git \
        curl \
        wget \
        unzip \
        vim \
        nano \
        tree \
        jq \
        htop \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install Go tools
RUN go install -v github.com/go-delve/delve/cmd/dlv@latest \
    && go install -v honnef.co/go/tools/cmd/staticcheck@latest \
    && go install -v golang.org/x/tools/cmd/goimports@latest \
    && go install -v github.com/golangci/golangci-lint/cmd/golangci-lint@latest \
    && go install -v github.com/cosmtrek/air@latest

# Set up Go environment
ENV GOPROXY=https://proxy.golang.org,direct
ENV GOSUMDB=sum.golang.org
ENV CGO_ENABLED=1

# Create workspace directory
WORKDIR /workspace

# Copy go mod files if they exist (for caching)
COPY go.mod go.sum* ./
RUN if [ -f go.sum ]; then go mod download; fi

USER vscode
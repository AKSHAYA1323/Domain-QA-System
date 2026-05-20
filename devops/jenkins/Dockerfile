FROM jenkins/jenkins:lts

USER root

# Install prerequisites
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg2 \
        lsb-release && \
    rm -rf /var/lib/apt/lists/*

# Install Docker CLI using the modern gpg keyring method (no apt-key)
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg \
        -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
      https://download.docker.com/linux/debian \
      $(lsb_release -cs) stable" \
      > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*

# Switch back to the jenkins user
USER jenkins

# ── Install Jenkins plugins for full Pipeline Stage View support ──
# pipeline-stage-view  → provides /wfapi/runs with stage data
# workflow-aggregator  → Pipeline DSL (stage, steps, etc.)
# git                  → SCM checkout support
RUN jenkins-plugin-cli --plugins \
    pipeline-stage-view:2.34 \
    workflow-aggregator:600.vb_57cdd26fdd7 \
    git:5.7.0

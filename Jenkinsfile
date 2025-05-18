pipeline {
    agent any
    environment {
        DOCKER_CRIDENTIALS_ID = 'dockerhub-jenkins'
        DOCKER_REGISTRY = 'https://hub.docker.com/u/doneze'
        DOCKER_HUB_REPO = 'doneze/reviewservices'
    }

    stages {
        stage('Clone repositories') {
            steps {
                cleanWs()
                dir('kubernetes_repo') {
                    git url: 'https://github.com/Dezeabasili/microservices_kubernetes.git', 
                     branch: 'main', 
                     credentialsId: 'github-cred'
                }               
                dir('review_services_repo') {
                    git url: 'https://github.com/Dezeabasili/microservices_reviews.git', 
                     branch: 'main', 
                     credentialsId: 'github-cred'
                }               
            }
        }

        stage('Get Docker Image version') {
            steps {
                script {
                    def MAJOR_VERSION = readFile file: 'kubernetes_repo/tags_folder/review_services/major_version.txt'
                    def MINOR_VERSION = readFile file: 'kubernetes_repo/tags_folder/review_services/minor_version.txt'
                    def INITIAL_PATCH_VERSION = readFile file: 'kubernetes_repo/tags_folder/review_services/patch_version.txt'
                    def PATCH_VERSION = (INITIAL_PATCH_VERSION.trim()).toInteger()
                    // if the value of INITIAL_PATCH_VERSION is not equal to 0, increase the value of INITIAL_PATCH_VERSION by 1 
                    if (PATCH_VERSION != 0) {
                        PATCH_VERSION += 1
                    }
                    env.DOCKER_TAG = "$MAJOR_VERSION.$MINOR_VERSION.$PATCH_VERSION"
                    env.NEW_PATCH_VERSION = "$PATCH_VERSION"
                    echo "$DOCKER_TAG"
                }
            }
        }



        stage('Build Docker Image') {
            steps {
                dir('review_services_repo') {
                    script {
                        dockerImage = docker.build("$DOCKER_HUB_REPO:$DOCKER_TAG", "-f Dockerfile .")
                    }
                }
                
            }
        }



        stage('Push To Docker') {
            steps {
                dir('review_services_repo') {
                    script {
                    echo "$DOCKER_TAG"
                    docker.withRegistry('https://registry.hub.docker.com', "$DOCKER_CRIDENTIALS_ID") {dockerImage.push("$DOCKER_TAG")}
                    }
                }
            }
        }


       
        stage('Modify Image Tag') {
            steps {
                dir('kubernetes_repo') {
                    script {
                    sh '''
                        # Fix the sed command to replace the entire line
                        sed -i "s|image:.*|image: $DOCKER_HUB_REPO:${DOCKER_TAG}|" \
                            kubernetes-manifests/microservices-folders/reviews/reviews-deployment.yaml

                        echo "$NEW_PATCH_VERSION" > tags_folder/review_services/patch_version.txt
                    '''
                }
                }
                
            }
        }



        stage('Commit & Push') {
            steps {

                withCredentials([usernamePassword(
                    credentialsId: 'github-cred', 
                    passwordVariable: 'GIT_PASSWORD', 
                    usernameVariable: 'GIT_USERNAME'
                )]) { dir('kubernetes_repo') {
                    sh '''
                        git config user.name "Dezeabasili"
                        git config user.email "ezeabasili@yahoo.co.uk"
                        
                        # Check if there are changes to commit
                        if git diff --quiet; then
                            echo "No changes to commit!!."
                        else
                            git add .
                            git commit -m "[ci skip] Update image tag to ${DOCKER_TAG}"
                            git push "https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/Dezeabasili/microservices_kubernetes.git"
                        fi
                    '''
                }
                    
                }
            }
        }
    }
}



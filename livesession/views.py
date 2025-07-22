from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import SessionSerializer
from production.models import CurrentProfile
from catalog.models import ProfileTemplate

class SessionAPIView(APIView):
    """API pour gérer les données de session."""
    
    def get(self, request):
        """Récupère les données de session."""
        data = {
            'profile_id': request.session.get('profile_id'),
            'shift_id': request.session.get('shift_id'),
            'operator_id': request.session.get('operator_id'),
            'shift_date': request.session.get('shift_date'),
            'vacation': request.session.get('vacation'),
            'start_time': request.session.get('start_time'),
            'end_time': request.session.get('end_time'),
            'machine_started_start': request.session.get('machine_started_start'),
            'machine_started_end': request.session.get('machine_started_end'),
            'length_start': request.session.get('length_start'),
            'length_end': request.session.get('length_end'),
            'comment': request.session.get('comment'),
            'of_en_cours': request.session.get('of_en_cours'),
            'target_length': request.session.get('target_length'),
            'of_decoupe': request.session.get('of_decoupe'),
            'roll_number': request.session.get('roll_number'),
            'tube_mass': request.session.get('tube_mass'),
            'roll_length': request.session.get('roll_length'),
            'total_mass': request.session.get('total_mass'),
            'next_tube_mass': request.session.get('next_tube_mass'),
            'roll_data': request.session.get('roll_data'),
            'checklist_responses': request.session.get('checklist_responses'),
            'checklist_signature': request.session.get('checklist_signature'),
            'checklist_signature_time': request.session.get('checklist_signature_time'),
            'quality_control': request.session.get('quality_control'),
        }
        return Response(data)
    
    def patch(self, request):
        """Met à jour partiellement les données de session."""
        serializer = SessionSerializer(data=request.data)
        
        if serializer.is_valid():
            # Passer la session au serializer pour la mise à jour
            serializer.update(request.session, serializer.validated_data)
            
            # Si on met à jour le profile_id, mettre à jour aussi CurrentProfile
            if 'profile_id' in serializer.validated_data:
                profile_id = serializer.validated_data.get('profile_id')
                
                if profile_id:
                    try:
                        profile = ProfileTemplate.objects.get(id=profile_id)
                        # Récupérer ou créer le CurrentProfile
                        current_profile, created = CurrentProfile.objects.get_or_create(
                            defaults={'profile': profile}
                        )
                        if not created:
                            current_profile.profile = profile
                            current_profile.save()
                    except ProfileTemplate.DoesNotExist:
                        pass
                else:
                    # Si profile_id est null, effacer le profil actuel
                    CurrentProfile.objects.all().update(profile=None)
            
            # Retourner les données actuelles de la session
            return Response({
                'profile_id': request.session.get('profile_id'),
                'shift_id': request.session.get('shift_id'),
                'operator_id': request.session.get('operator_id'),
                'shift_date': request.session.get('shift_date'),
                'vacation': request.session.get('vacation'),
                'start_time': request.session.get('start_time'),
                'end_time': request.session.get('end_time'),
                'machine_started_start': request.session.get('machine_started_start'),
                'machine_started_end': request.session.get('machine_started_end'),
                'length_start': request.session.get('length_start'),
                'length_end': request.session.get('length_end'),
                'comment': request.session.get('comment'),
                'of_en_cours': request.session.get('of_en_cours'),
                'target_length': request.session.get('target_length'),
                'of_decoupe': request.session.get('of_decoupe'),
                'roll_number': request.session.get('roll_number'),
                'tube_mass': request.session.get('tube_mass'),
                'roll_length': request.session.get('roll_length'),
                'total_mass': request.session.get('total_mass'),
                'next_tube_mass': request.session.get('next_tube_mass'),
                'roll_data': request.session.get('roll_data'),
                'checklist_responses': request.session.get('checklist_responses'),
                'checklist_signature': request.session.get('checklist_signature'),
                'checklist_signature_time': request.session.get('checklist_signature_time'),
                'quality_control': request.session.get('quality_control'),
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

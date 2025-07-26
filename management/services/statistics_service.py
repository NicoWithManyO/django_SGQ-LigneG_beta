from django.db.models import Avg, Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal

from production.models import Shift, Roll
from quality.models import RollDefect
from wcm.models import LostTimeEntry
from planification.models import Operator, FabricationOrder


class StatisticsService:
    """Service pour les statistiques et analyses de production."""
    
    @staticmethod
    def get_dashboard_statistics():
        """
        Récupère les statistiques globales pour le dashboard management.
        
        Returns:
            dict: KPIs globaux, tendances, alertes
        """
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        return {
            'current_kpis': StatisticsService._get_current_kpis(),
            'daily_trends': StatisticsService._get_daily_trends(days=7),
            'weekly_comparison': StatisticsService._get_period_comparison(week_start, today),
            'monthly_stats': StatisticsService._get_monthly_statistics(month_start, today),
            'operator_performance': StatisticsService._get_operator_performance(days=30),
            'defects_analysis': StatisticsService._get_defects_analysis(days=30),
            'alerts': StatisticsService._get_production_alerts()
        }
    
    @staticmethod
    def _get_current_kpis():
        """KPIs de la journée en cours."""
        today = timezone.now().date()
        shifts_today = Shift.objects.filter(date=today)
        
        # Calcul des moyennes pondérées
        total_length = 0
        weighted_trs = 0
        weighted_availability = 0
        weighted_performance = 0
        weighted_quality = 0
        
        for shift in shifts_today:
            length = float(shift.total_length or 0)
            if length > 0:
                from .report_service import ReportService
                kpis = ReportService._calculate_kpis(shift)
                
                total_length += length
                weighted_trs += kpis['trs'] * length
                weighted_availability += kpis['availability'] * length
                weighted_performance += kpis['performance'] * length
                weighted_quality += kpis['quality'] * length
        
        if total_length > 0:
            avg_trs = weighted_trs / total_length
            avg_availability = weighted_availability / total_length
            avg_performance = weighted_performance / total_length
            avg_quality = weighted_quality / total_length
        else:
            avg_trs = avg_availability = avg_performance = avg_quality = 0
        
        return {
            'date': today,
            'shifts_count': shifts_today.count(),
            'total_production': total_length,
            'avg_trs': round(avg_trs, 1),
            'avg_availability': round(avg_availability, 1),
            'avg_performance': round(avg_performance, 1),
            'avg_quality': round(avg_quality, 1)
        }
    
    @staticmethod
    def _get_daily_trends(days=7):
        """Tendances journalières sur N jours."""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days-1)
        
        trends = []
        current_date = start_date
        
        while current_date <= end_date:
            shifts = Shift.objects.filter(date=current_date)
            
            daily_stats = {
                'date': current_date,
                'shifts_count': shifts.count(),
                'total_production': float(shifts.aggregate(Sum('total_length'))['total_length__sum'] or 0),
                'ok_production': float(shifts.aggregate(Sum('ok_length'))['ok_length__sum'] or 0),
                'nok_production': float(shifts.aggregate(Sum('nok_length'))['nok_length__sum'] or 0),
                'rolls_count': Roll.objects.filter(shift__date=current_date).count(),
                'defects_count': RollDefect.objects.filter(roll__shift__date=current_date).count(),
                'lost_time': LostTimeEntry.objects.filter(shift__date=current_date).aggregate(Sum('duration'))['duration__sum'] or 0
            }
            
            # Calcul du TRS moyen pondéré
            if daily_stats['total_production'] > 0:
                from .report_service import ReportService
                total_length = 0
                weighted_trs = 0
                
                for shift in shifts:
                    length = float(shift.total_length or 0)
                    if length > 0:
                        kpis = ReportService._calculate_kpis(shift)
                        total_length += length
                        weighted_trs += kpis['trs'] * length
                
                daily_stats['avg_trs'] = round(weighted_trs / total_length, 1) if total_length > 0 else 0
            else:
                daily_stats['avg_trs'] = 0
            
            trends.append(daily_stats)
            current_date += timedelta(days=1)
        
        return trends
    
    @staticmethod
    def _get_period_comparison(start_date, end_date):
        """Compare la période actuelle avec la période précédente."""
        period_length = (end_date - start_date).days + 1
        prev_end_date = start_date - timedelta(days=1)
        prev_start_date = prev_end_date - timedelta(days=period_length-1)
        
        current_stats = StatisticsService._get_period_stats(start_date, end_date)
        previous_stats = StatisticsService._get_period_stats(prev_start_date, prev_end_date)
        
        # Calcul des variations
        comparison = {
            'current_period': {
                'start': start_date,
                'end': end_date,
                'stats': current_stats
            },
            'previous_period': {
                'start': prev_start_date,
                'end': prev_end_date,
                'stats': previous_stats
            },
            'variations': {}
        }
        
        # Calcul des variations en pourcentage
        for key in ['total_production', 'avg_trs', 'quality_rate', 'defects_rate']:
            if key in current_stats and key in previous_stats:
                if previous_stats[key] > 0:
                    variation = ((current_stats[key] - previous_stats[key]) / previous_stats[key]) * 100
                    comparison['variations'][key] = round(variation, 1)
                else:
                    comparison['variations'][key] = 100 if current_stats[key] > 0 else 0
        
        return comparison
    
    @staticmethod
    def _get_period_stats(start_date, end_date):
        """Statistiques pour une période donnée."""
        shifts = Shift.objects.filter(date__range=[start_date, end_date])
        
        total_production = float(shifts.aggregate(Sum('total_length'))['total_length__sum'] or 0)
        ok_production = float(shifts.aggregate(Sum('ok_length'))['ok_length__sum'] or 0)
        
        stats = {
            'shifts_count': shifts.count(),
            'total_production': total_production,
            'ok_production': ok_production,
            'quality_rate': round((ok_production / total_production * 100) if total_production > 0 else 0, 1),
            'rolls_count': Roll.objects.filter(shift__date__range=[start_date, end_date]).count(),
            'defects_count': RollDefect.objects.filter(roll__shift__date__range=[start_date, end_date]).count()
        }
        
        # Calcul du TRS moyen
        if total_production > 0:
            from .report_service import ReportService
            total_length = 0
            weighted_trs = 0
            
            for shift in shifts:
                length = float(shift.total_length or 0)
                if length > 0:
                    kpis = ReportService._calculate_kpis(shift)
                    total_length += length
                    weighted_trs += kpis['trs'] * length
            
            stats['avg_trs'] = round(weighted_trs / total_length, 1) if total_length > 0 else 0
        else:
            stats['avg_trs'] = 0
        
        # Taux de défauts
        stats['defects_rate'] = round(stats['defects_count'] / stats['rolls_count'] * 100, 1) if stats['rolls_count'] > 0 else 0
        
        return stats
    
    @staticmethod
    def _get_monthly_statistics(start_date, end_date):
        """Statistiques mensuelles détaillées."""
        shifts = Shift.objects.filter(
            date__range=[start_date, end_date]
        ).select_related('operator')
        
        # Statistiques par vacation
        vacation_stats = {}
        for vacation_choice in Shift.VACATION_CHOICES:
            vacation = vacation_choice[0]
            vacation_shifts = shifts.filter(vacation=vacation)
            
            vacation_stats[vacation] = {
                'count': vacation_shifts.count(),
                'total_production': float(vacation_shifts.aggregate(Sum('total_length'))['total_length__sum'] or 0),
                'avg_production': 0
            }
            
            if vacation_stats[vacation]['count'] > 0:
                vacation_stats[vacation]['avg_production'] = round(
                    vacation_stats[vacation]['total_production'] / vacation_stats[vacation]['count'], 1
                )
        
        # Top 5 opérateurs
        operator_production = shifts.values(
            'operator__first_name',
            'operator__last_name'
        ).annotate(
            total_production=Sum('total_length'),
            shifts_count=Count('id')
        ).order_by('-total_production')[:5]
        
        return {
            'period': f"{start_date} au {end_date}",
            'total_shifts': shifts.count(),
            'vacation_statistics': vacation_stats,
            'top_operators': list(operator_production),
            'total_production': float(shifts.aggregate(Sum('total_length'))['total_length__sum'] or 0),
            'total_lost_time': LostTimeEntry.objects.filter(
                shift__date__range=[start_date, end_date]
            ).aggregate(Sum('duration'))['duration__sum'] or 0
        }
    
    @staticmethod
    def _get_operator_performance(days=30):
        """Performance des opérateurs sur N jours."""
        since_date = timezone.now().date() - timedelta(days=days)
        
        operators = Operator.objects.filter(
            shifts__date__gte=since_date
        ).distinct()
        
        performance_data = []
        
        for operator in operators:
            operator_shifts = Shift.objects.filter(
                operator=operator,
                date__gte=since_date
            )
            
            if operator_shifts.exists():
                total_production = float(operator_shifts.aggregate(Sum('total_length'))['total_length__sum'] or 0)
                ok_production = float(operator_shifts.aggregate(Sum('ok_length'))['ok_length__sum'] or 0)
                
                # Calcul du TRS moyen
                from .report_service import ReportService
                total_length = 0
                weighted_trs = 0
                
                for shift in operator_shifts:
                    length = float(shift.total_length or 0)
                    if length > 0:
                        kpis = ReportService._calculate_kpis(shift)
                        total_length += length
                        weighted_trs += kpis['trs'] * length
                
                avg_trs = round(weighted_trs / total_length, 1) if total_length > 0 else 0
                
                performance_data.append({
                    'operator': f"{operator.first_name} {operator.last_name}",
                    'shifts_count': operator_shifts.count(),
                    'total_production': total_production,
                    'avg_production_per_shift': round(total_production / operator_shifts.count(), 1),
                    'quality_rate': round((ok_production / total_production * 100) if total_production > 0 else 0, 1),
                    'avg_trs': avg_trs
                })
        
        # Trier par TRS moyen décroissant
        performance_data.sort(key=lambda x: x['avg_trs'], reverse=True)
        
        return performance_data[:10]  # Top 10
    
    @staticmethod
    def _get_defects_analysis(days=30):
        """Analyse des défauts sur N jours."""
        since_date = timezone.now().date() - timedelta(days=days)
        
        defects = RollDefect.objects.filter(
            roll__shift__date__gte=since_date
        ).values(
            'defect_type__name',
            'defect_type__severity'
        ).annotate(
            count=Count('id')
        ).order_by('-count')
        
        total_defects = sum(d['count'] for d in defects)
        
        # Ajouter le pourcentage
        defects_with_percentage = []
        for defect in defects:
            defect['percentage'] = round((defect['count'] / total_defects * 100) if total_defects > 0 else 0, 1)
            defects_with_percentage.append(defect)
        
        # Tendance des défauts bloquants
        blocking_trend = []
        for i in range(7):
            date = timezone.now().date() - timedelta(days=i)
            blocking_count = RollDefect.objects.filter(
                roll__shift__date=date,
                defect_type__severity='blocking'
            ).count()
            blocking_trend.append({
                'date': date,
                'count': blocking_count
            })
        blocking_trend.reverse()
        
        return {
            'total_count': total_defects,
            'by_type': defects_with_percentage[:10],  # Top 10
            'blocking_defects_trend': blocking_trend
        }
    
    @staticmethod
    def _get_production_alerts():
        """Génère des alertes basées sur les seuils de production."""
        alerts = []
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        # Alerte TRS faible
        recent_shifts = Shift.objects.filter(date__gte=yesterday)
        for shift in recent_shifts:
            from .report_service import ReportService
            kpis = ReportService._calculate_kpis(shift)
            
            if kpis['trs'] < 60:  # Seuil TRS à 60%
                alerts.append({
                    'type': 'trs_low',
                    'severity': 'warning' if kpis['trs'] >= 50 else 'danger',
                    'message': f"TRS faible pour {shift.shift_id}: {kpis['trs']}%",
                    'shift_id': shift.id,
                    'date': shift.date
                })
        
        # Alerte défauts bloquants élevés
        blocking_defects_today = RollDefect.objects.filter(
            roll__shift__date=today,
            defect_type__severity='blocking'
        ).count()
        
        if blocking_defects_today > 10:  # Seuil à 10 défauts bloquants
            alerts.append({
                'type': 'blocking_defects_high',
                'severity': 'danger',
                'message': f"{blocking_defects_today} défauts bloquants aujourd'hui",
                'date': today
            })
        
        # Alerte temps perdu élevé
        lost_time_today = LostTimeEntry.objects.filter(
            shift__date=today
        ).aggregate(Sum('duration'))['duration__sum'] or 0
        
        if lost_time_today > 120:  # Seuil à 2 heures
            alerts.append({
                'type': 'lost_time_high',
                'severity': 'warning',
                'message': f"{lost_time_today} minutes de temps perdu aujourd'hui",
                'date': today
            })
        
        return alerts
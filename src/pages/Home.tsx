import React, { useMemo, useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
  RefresherEventDetail,
} from '@ionic/react';
import {
  addOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  closeOutline,
  layersOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import { FilterOption, Incident, IncidentPriority } from '../types/incident';

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-101',
    title: 'Fallo de enlace en Switch Rack B',
    location: 'Aula 204 - Redes',
    description: 'Pérdida intermitente de paquetes en puertos Gigabit 12 al 16.',
    priority: 'alta',
    status: 'pendiente',
    createdAt: '09:15',
  },
  {
    id: 'INC-102',
    title: 'Actualización de imágenes Docker',
    location: 'Laboratorio DAM 2',
    description: 'Desplegar imagen base Node 22 Alpine en estaciones de trabajo.',
    priority: 'media',
    status: 'pendiente',
    createdAt: '10:30',
  },
  {
    id: 'INC-103',
    title: 'Calibración de proyector láser',
    location: 'Aula Magna',
    description: 'Ajuste trapezoidal y verificación de entrada HDMI.',
    priority: 'baja',
    status: 'resuelta',
    createdAt: 'Ayer',
  },
];

const PRIORITY_BADGE_STYLES: Record<IncidentPriority, string> = {
  alta: 'bg-[#ff5c5c] text-black',
  media: 'bg-[#fde047] text-black',
  baja: 'bg-[#86efac] text-black',
};

const Home: React.FC = () => {
  // Estado principal de datos y controles UI
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('todas');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estado controlado del formulario modal
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<IncidentPriority>('media');

  // Referencia a IonList para cerrar elementos deslizados programáticamente
  const listRef = useRef<HTMLIonListElement | null>(null);

  // Cálculo memoizado de indicadores KPI (CE 3.e: optimización de renderizado)
  const metrics = useMemo(() => {
    const total = incidents.length;
    const pending = incidents.filter((item) => item.status === 'pendiente').length;
    const resolved = incidents.filter((item) => item.status === 'resuelta').length;
    const critical = incidents.filter(
      (item) => item.status === 'pendiente' && item.priority === 'alta'
    ).length;
    return { total, pending, resolved, critical };
  }, [incidents]);

  // Filtrado combinado por estado y búsqueda textual
  const filteredIncidents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return incidents.filter((item) => {
      const matchesStatus = activeFilter === 'todas' || item.status === activeFilter;
      const matchesQuery =
        normalizedQuery === '' ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.location.toLowerCase().includes(normalizedQuery) ||
        item.id.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [incidents, activeFilter, searchQuery]);

  // Gesto nativo Pull-to-Refresh
  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    setTimeout(() => {
      setToastMessage('Estado sincronizado con el servidor');
      event.detail.complete();
    }, 700);
  };

  // Alternar estado pendiente / resuelta desde IonItemSliding
  const handleToggleStatus = async (id: string) => {
    setIncidents((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'pendiente' ? 'resuelta' : 'pendiente' }
          : item
      )
    );
    await listRef.current?.closeSlidingItems();
    setToastMessage('Estado de incidencia actualizado');
  };

  // Eliminación de elemento
  const handleDeleteIncident = async (id: string) => {
    setIncidents((prev) => prev.filter((item) => item.id !== id));
    await listRef.current?.closeSlidingItems();
    setToastMessage(`Incidencia ${id} eliminada`);
  };

  // Creación de nueva incidencia desde IonModal
  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) {
      setToastMessage('El título y la ubicación son obligatorios');
      return;
    }

    const newIncident: Incident = {
      id: `INC-${Math.floor(104 + Math.random() * 895)}`,
      title: title.trim(),
      location: location.trim(),
      description: description.trim() || 'Sin observaciones adicionales.',
      priority,
      status: 'pendiente',
      createdAt: new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setIncidents((prev) => [newIncident, ...prev]);
    setTitle('');
    setLocation('');
    setDescription('');
    setPriority('media');
    setIsModalOpen(false);
    setToastMessage(`Incidencia ${newIncident.id} registrada`);
  };

  const tarjetaKpi =
    'border-4 border-black p-4 shadow-[6px_6px_0_0_#000] transition-transform duration-150 hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-1.5 active:translate-y-1.5';

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="brutal-toolbar">
          <IonTitle className="font-black uppercase tracking-tight">SmartLab Monitor</IonTitle>
          <IonButtons slot="end">
            <div className="mr-3 flex items-center gap-2">
              <span className="hidden text-xs font-black uppercase sm:inline">Pendientes:</span>
              <span className="border-4 border-black bg-white px-2 py-0.5 text-base font-black">
                {metrics.pending}
              </span>
            </div>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Desliza para actualizar"
            refreshingSpinner="crescent"
            refreshingText="Sincronizando..."
          />
        </IonRefresher>

        <div className="min-h-[100vh]">
          <section className="flex min-h-[40vh] flex-col justify-center border-b-4 border-black bg-[#1d4ed8] px-4 py-8 sm:px-6">
            <div className="mx-auto w-full max-w-5xl">
              <p className="mb-3 inline-block border-4 border-black bg-[#fde047] px-3 py-1 text-xs font-black uppercase tracking-widest text-black">
                Laboratorio DAM · Panel de incidencias
              </p>
              <h1 className="text-4xl font-black uppercase leading-none text-white sm:text-6xl lg:text-7xl">
                Incidencias
                <br />
                del centro
              </h1>
              <p className="mt-4 max-w-xl text-base font-bold text-white sm:text-lg">
                {metrics.pending} pendientes · {metrics.critical} críticas · {metrics.resolved} resueltas
              </p>
            </div>
          </section>

          <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6">
            <section aria-label="Resumen de métricas" className="mb-8">
              <h2 className="mb-4 text-sm font-black uppercase tracking-widest">Estado operativo</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className={`${tarjetaKpi} bg-white`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase">Total</span>
                    <IonIcon icon={layersOutline} className="text-xl" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-4xl font-black">{metrics.total}</p>
                </div>

                <div className={`${tarjetaKpi} bg-[#fde047]`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase">Pendientes</span>
                    <IonIcon icon={timeOutline} className="text-xl" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-4xl font-black">{metrics.pending}</p>
                </div>

                <div className={`${tarjetaKpi} bg-[#ff5c5c]`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase">Críticas</span>
                    <IonIcon icon={alertCircleOutline} className="text-xl" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-4xl font-black">{metrics.critical}</p>
                </div>

                <div className={`${tarjetaKpi} bg-[#86efac]`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase">Resueltas</span>
                    <IonIcon icon={checkmarkCircleOutline} className="text-xl" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-4xl font-black">{metrics.resolved}</p>
                </div>
              </div>
            </section>

            <section aria-label="Filtros de búsqueda" className="mb-6 space-y-4">
              <div className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000] focus-within:shadow-[6px_6px_0_0_#1d4ed8]">
                <IonSearchbar
                  value={searchQuery}
                  onIonInput={(e) => setSearchQuery(e.detail.value ?? '')}
                  placeholder="Buscar por código, título o aula..."
                  debounce={200}
                  className="brutal-searchbar"
                  aria-label="Buscar incidencias"
                />
              </div>

              <div className="border-4 border-black shadow-[6px_6px_0_0_#000]">
                <IonSegment
                  className="brutal-segment"
                  scrollable
                  value={activeFilter}
                  onIonChange={(e) => setActiveFilter((e.detail.value as FilterOption) ?? 'todas')}
                >
                  <IonSegmentButton value="todas">
                    <IonLabel>Todas ({metrics.total})</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="pendiente">
                    <IonLabel>Pendientes ({metrics.pending})</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="resuelta">
                    <IonLabel>Resueltas ({metrics.resolved})</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </div>
            </section>

            <section aria-label="Listado de incidencias">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-sm font-black uppercase tracking-widest">
                  Incidencias ({filteredIncidents.length})
                </h2>
                <span className="text-xs font-bold">Desliza una incidencia para ver sus acciones</span>
              </div>

              {filteredIncidents.length === 0 ? (
                <div className="border-4 border-dashed border-black bg-white p-8 text-center">
                  <p className="text-sm font-black uppercase">No hay incidencias con ese filtro</p>
                </div>
              ) : (
                <div className="md:max-h-[60vh] md:overflow-y-auto md:pr-3">
                  <IonList ref={listRef} lines="none" className="space-y-5 bg-transparent p-0 pb-2 pr-2">
                    {filteredIncidents.map((incident) => (
                      <IonItemSliding
                        key={incident.id}
                        className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000] transition-transform duration-150 hover:-translate-y-1"
                      >
                        <IonItem className="incident-item">
                          <div className="w-full py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="bg-black px-2 py-0.5 font-mono text-xs font-bold text-white">
                                  {incident.id}
                                </span>
                                <span
                                  className={`border-2 border-black px-2 py-0.5 text-xs font-black uppercase ${
                                    PRIORITY_BADGE_STYLES[incident.priority]
                                  }`}
                                >
                                  {incident.priority}
                                </span>
                              </div>
                              <span className="text-xs font-bold">{incident.createdAt}</span>
                            </div>

                            <h3
                              className={`mt-2 text-lg font-black uppercase leading-tight ${
                                incident.status === 'resuelta' ? 'line-through opacity-50' : ''
                              }`}
                            >
                              {incident.title}
                            </h3>

                            <p className="mt-1 text-sm font-medium">{incident.description}</p>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t-4 border-black pt-3">
                              <span className="text-xs font-bold uppercase">
                                Ubicación: <strong className="font-black">{incident.location}</strong>
                              </span>

                              <button
                                type="button"
                                onClick={() => handleToggleStatus(incident.id)}
                                className={`min-h-[44px] border-4 border-black px-3 text-xs font-black uppercase shadow-[3px_3px_0_0_#000] transition-transform duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1d4ed8] ${
                                  incident.status === 'resuelta' ? 'bg-[#86efac]' : 'bg-[#fde047]'
                                }`}
                              >
                                {incident.status === 'resuelta' ? 'Resuelta' : 'Pendiente'}
                              </button>
                            </div>
                          </div>
                        </IonItem>

                        <IonItemOptions side="end">
                          <IonItemOption
                            color="success"
                            onClick={() => handleToggleStatus(incident.id)}
                            aria-label="Cambiar estado"
                          >
                            <IonIcon slot="icon-only" icon={checkmarkCircleOutline} />
                          </IonItemOption>
                          <IonItemOption
                            color="danger"
                            onClick={() => handleDeleteIncident(incident.id)}
                            aria-label="Eliminar incidencia"
                          >
                            <IonIcon slot="icon-only" icon={trashOutline} />
                          </IonItemOption>
                        </IonItemOptions>
                      </IonItemSliding>
                    ))}
                  </IonList>
                </div>
              )}
            </section>
          </div>
        </div>

        <IonFab slot="fixed" vertical="bottom" horizontal="end" className="mb-4 mr-4">
          <IonFabButton
            className="brutal-fab"
            onClick={() => setIsModalOpen(true)}
            aria-label="Registrar nueva incidencia"
          >
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar className="brutal-toolbar">
              <IonTitle className="font-black uppercase">Nueva incidencia</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsModalOpen(false)} aria-label="Cerrar formulario">
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            <form onSubmit={handleCreateIncident} className="flex flex-col gap-5">
              <IonItem className="brutal-input border-4 border-black focus-within:shadow-[6px_6px_0_0_#1d4ed8]">
                <IonInput
                  label="Título de la incidencia *"
                  labelPlacement="stacked"
                  placeholder="Ej. Error de compilación en SDK"
                  value={title}
                  onIonInput={(e) => setTitle(e.detail.value ?? '')}
                  required
                />
              </IonItem>

              <IonItem className="brutal-input border-4 border-black focus-within:shadow-[6px_6px_0_0_#1d4ed8]">
                <IonInput
                  label="Aula o ubicación *"
                  labelPlacement="stacked"
                  placeholder="Ej. Laboratorio 102"
                  value={location}
                  onIonInput={(e) => setLocation(e.detail.value ?? '')}
                  required
                />
              </IonItem>

              <IonItem className="brutal-input border-4 border-black focus-within:shadow-[6px_6px_0_0_#1d4ed8]">
                <IonSelect
                  label="Nivel de prioridad"
                  labelPlacement="stacked"
                  value={priority}
                  onIonChange={(e) => setPriority(e.detail.value as IncidentPriority)}
                >
                  <IonSelectOption value="alta">Alta (crítica)</IonSelectOption>
                  <IonSelectOption value="media">Media (operativa)</IonSelectOption>
                  <IonSelectOption value="baja">Baja (mantenimiento)</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem className="brutal-input border-4 border-black focus-within:shadow-[6px_6px_0_0_#1d4ed8]">
                <IonTextarea
                  label="Descripción técnica"
                  labelPlacement="stacked"
                  rows={4}
                  placeholder="Detalla los síntomas observados..."
                  value={description}
                  onIonInput={(e) => setDescription(e.detail.value ?? '')}
                />
              </IonItem>

              <div className="pt-2">
                <IonButton expand="block" type="submit" className="brutal-button">
                  Guardar incidencia
                </IonButton>
              </div>
            </form>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={toastMessage !== null}
          message={toastMessage ?? ''}
          duration={2200}
          position="bottom"
          onDidDismiss={() => setToastMessage(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;